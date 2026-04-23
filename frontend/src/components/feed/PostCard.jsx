import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PostCard({ post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = post.author?._id === user?._id;

  // ─── Like mutation (optimistic) ──────────────────────────────────────────

  const likeMutation = useMutation({
    mutationFn: () => api.put(`/posts/${post._id}/like`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previousFeed = queryClient.getQueryData(["feed"]);

      queryClient.setQueryData(["feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p._id !== post._id) return p;
              const wasLiked = p.isLiked;
              return {
                ...p,
                isLiked: !wasLiked,
                likesCount: wasLiked
                  ? Math.max(0, (p.likesCount || 0) - 1)
                  : (p.likesCount || 0) + 1,
              };
            }),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["feed"], context.previousFeed);
      toast.error("Failed to update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  // ─── Comment mutation ────────────────────────────────────────────────────

  const commentMutation = useMutation({
    mutationFn: (content) => api.post(`/posts/${post._id}/comment`, { content }),
    onSuccess: () => {
      setCommentText("");
      // Optimistically bump comment count
      queryClient.setQueryData(["feed"], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p._id === post._id
                ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
                : p
            ),
          })),
        };
      });
      // Refresh comments list
      queryClient.invalidateQueries({ queryKey: ["comments", post._id] });
    },
    onError: () => toast.error("Failed to add comment"),
  });

  // ─── Delete mutation ─────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${post._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post deleted");
    },
  });

  // ─── Share mutation ──────────────────────────────────────────────────────

  const shareMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post._id}/share`, { content: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post shared to your feed!");
    },
    onError: () => toast.error("Failed to share"),
  });

  // ─── Lazy-loaded comments (only when expanded) ──────────────────────────

  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ["comments", post._id],
    queryFn: () => api.get(`/posts/${post._id}/comments?limit=20`).then((r) => r.data),
    enabled: showComments,
    staleTime: 30_000,
  });

  const comments = commentsData?.comments || [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success("Link copied!");
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText.trim());
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden transition-shadow hover:shadow-card-hover">
      {/* Shared post header */}
      {post.type === "share" && post.sharedPost && (
        <div className="px-4 pt-3 pb-1 text-xs text-gray-400 flex items-center gap-1">
          <Share2 size={12} /> {post.author?.name} shared a post
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between p-4 pb-2">
        <Link to={`/profile/${post.author?.username || post.author?._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar src={post.author?.profilePic} name={post.author?.name} size="md" />
          <div>
            <p className="font-semibold text-sm text-gray-900">{post.author?.name}</p>
            <p className="text-xs text-gray-400 line-clamp-1">
              {post.author?.headline && <>{post.author.headline} · </>}
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        <div className="relative">
          <button onClick={() => setShowMenu((p) => !p)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <MoreHorizontal size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-card-hover border border-surface-border py-1 z-10">
              <button onClick={() => { handleCopyLink(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left">
                Copy link
              </button>
              {isOwner && (
                <button onClick={() => { deleteMutation.mutate(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 text-left flex items-center gap-1.5">
                  <Trash2 size={12} /> Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 bg-primary-50 text-primary rounded-full font-medium">#{t}</span>
          ))}
        </div>
      )}

      {/* Image */}
      {post.image && (
        <img src={post.image} alt="post" className="w-full max-h-[460px] object-cover" loading="lazy" />
      )}

      {/* Shared post preview */}
      {post.type === "share" && post.sharedPost && (
        <div className="mx-4 mb-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Avatar src={post.sharedPost.author?.profilePic} name={post.sharedPost.author?.name} size="sm" />
            <div>
              <p className="text-xs font-semibold text-gray-800">{post.sharedPost.author?.name}</p>
              <p className="text-[10px] text-gray-400">{post.sharedPost.author?.headline}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-3">{post.sharedPost.content}</p>
          {post.sharedPost.image && (
            <img src={post.sharedPost.image} alt="" className="w-full h-32 object-cover rounded-lg mt-2" />
          )}
        </div>
      )}

      {/* Engagement stats bar */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
          {post.likesCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <Heart size={9} className="text-white fill-white" />
              </span>
              {post.likesCount}
            </span>
          )}
          {post.commentsCount > 0 && (
            <button onClick={() => setShowComments((p) => !p)} className="hover:underline hover:text-gray-600 transition-colors">
              {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between px-2 py-1 border-t border-gray-100">
        <div className="flex items-center flex-1">
          <button
            id={`like-btn-${post._id}`}
            onClick={() => likeMutation.mutate()}
            className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              post.isLiked
                ? "text-primary bg-primary-50/60"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Heart
              size={16}
              className={`transition-transform duration-200 ${post.isLiked ? "fill-primary scale-110" : "scale-100"}`}
            />
            <span>{post.isLiked ? "Liked" : "Like"}</span>
          </button>
          <button
            onClick={() => setShowComments((p) => !p)}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={16} />
            <span>Comment</span>
          </button>
          <button
            onClick={() => shareMutation.mutate()}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
        <button onClick={handleCopyLink} className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bookmark size={16} />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-100 overflow-hidden">
          {/* Comment input */}
          <div className="flex gap-2.5 px-4 py-3">
            <Avatar src={user?.profilePic} name={user?.name} size="xs" />
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                placeholder="Add a comment..."
                className="flex-1 text-xs bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || commentMutation.isPending}
                className="text-primary disabled:opacity-30 transition-opacity"
              >
                {commentMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </div>

          {/* Comments list */}
          {commentsLoading ? (
            <div className="px-4 pb-3 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2.5 animate-pulse">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="bg-gray-100 rounded-xl px-3 py-2 flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-200 rounded w-20" />
                    <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="px-4 pb-3 space-y-2.5">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2.5 group">
                  <Link to={`/profile/${c.user?.username || c.user?._id}`}>
                    <Avatar src={c.user?.profilePic} name={c.user?.name} size="xs" />
                  </Link>
                  <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link to={`/profile/${c.user?.username || c.user?._id}`} className="text-xs font-semibold text-gray-800 hover:underline">
                        {c.user?.name}
                      </Link>
                      <span className="text-[10px] text-gray-300">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 break-words">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 pb-3 text-xs text-gray-400">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </div>
  );
}
