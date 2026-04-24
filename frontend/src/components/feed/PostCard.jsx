import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, MessageCircle, Share2, Trash2, MoreHorizontal,
  ChevronDown, ChevronUp, Send, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Comment Component ────────────────────────────────────────────────────────

function Comment({ comment, postId, onReply }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?._id === comment.user?._id;

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${postId}/comment/${comment._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  return (
    <div className="flex gap-2.5">
      <Link to={`/profile/${comment.user?.username || comment.user?._id}`}>
        <Avatar src={comment.user?.profilePic} name={comment.user?.name} size="xs" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <Link
            to={`/profile/${comment.user?.username || comment.user?._id}`}
            className="text-xs font-semibold text-gray-900 hover:text-primary"
          >
            {comment.user?.name}
          </Link>
          <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
          <button
            onClick={() => onReply(comment)}
            className="text-[10px] font-semibold text-gray-500 hover:text-primary transition-colors"
          >
            Reply
          </button>
          {isOwner && (
            <button
              onClick={() => {
                if (confirm("Delete this comment?")) deleteMutation.mutate();
              }}
              className="text-[10px] font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <Comment key={reply._id} comment={reply} postId={postId} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ postId, onClose }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const shareMutation = useMutation({
    mutationFn: () => api.post(`/posts/${postId}/share`, { content: text }),
    onSuccess: () => {
      toast.success("Post shared to your feed!");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to share"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Share Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment about this post... (optional)"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => shareMutation.mutate()}
            loading={shareMutation.isPending}
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

export default function PostCard({ post: initialPost }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // comment object
  const [showShareModal, setShowShareModal] = useState(false);

  const isOwner = user?._id === post.author?._id;

  // ── Like ─────────────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => api.put(`/posts/${post._id}/like`),
    onMutate: () => {
      // Optimistic update
      setPost((p) => ({
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
      }));
    },
    onSuccess: ({ data }) => {
      setPost((p) => ({
        ...p,
        isLiked: data.isLiked,
        likesCount: data.likesCount,
        engagementScore: data.engagementScore,
      }));
    },
    onError: () => {
      // Revert
      setPost(initialPost);
      toast.error("Failed to like post");
    },
  });

  // ── Delete Post ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${post._id}`),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
    onError: () => toast.error("Failed to delete post"),
  });

  // ── Comments ──────────────────────────────────────────────────────────────
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", post._id],
    queryFn: () => api.get(`/posts/${post._id}/comments?limit=20`).then((r) => r.data),
    enabled: showComments,
  });

  const comments = commentsData?.comments || [];

  const commentMutation = useMutation({
    mutationFn: ({ content, parentComment }) =>
      api.post(`/posts/${post._id}/comment`, { content, parentComment }),
    onSuccess: () => {
      setCommentText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", post._id] });
      setPost((p) => ({ ...p, commentsCount: (p.commentsCount || 0) + 1 }));
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const handleComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    commentMutation.mutate({
      content: trimmed,
      parentComment: replyingTo?._id || undefined,
    });
  };

  // ── Shared post preview ───────────────────────────────────────────────────
  const isShare = post.type === "share" && post.sharedPost;

  return (
    <>
      <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
        {/* Author row */}
        <div className="flex items-start justify-between p-4 pb-3">
          <Link
            to={`/profile/${post.author?.username || post.author?._id}`}
            className="flex items-center gap-3 group"
          >
            <Avatar src={post.author?.profilePic} name={post.author?.name} size="md" />
            <div>
              <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">
                {post.author?.name}
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">{post.author?.headline}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(post.createdAt)}</p>
            </div>
          </Link>

          {isOwner && (
            <button
              onClick={() => {
                if (confirm("Delete this post?")) deleteMutation.mutate();
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[11px] text-primary font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Image */}
        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="w-full max-h-[500px] object-cover"
            loading="lazy"
          />
        )}

        {/* Shared post preview */}
        {isShare && post.sharedPost && (
          <div className="mx-4 mb-3 rounded-xl border border-surface-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-surface-border">
              <Avatar
                src={post.sharedPost.author?.profilePic}
                name={post.sharedPost.author?.name}
                size="xs"
              />
              <span className="text-xs font-semibold text-gray-700">
                {post.sharedPost.author?.name}
              </span>
              <span className="text-[10px] text-gray-400">
                · {timeAgo(post.sharedPost.createdAt)}
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm text-gray-700 line-clamp-3">{post.sharedPost.content}</p>
              {post.sharedPost.image && (
                <img
                  src={post.sharedPost.image}
                  alt=""
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="px-4 py-2 flex items-center gap-1 text-xs text-gray-400 border-t border-surface-border">
          {post.likesCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart size={11} className="text-red-400 fill-red-400" /> {post.likesCount}
            </span>
          )}
          {post.likesCount > 0 && post.commentsCount > 0 && (
            <span className="mx-1">·</span>
          )}
          {post.commentsCount > 0 && (
            <button
              onClick={() => setShowComments((v) => !v)}
              className="hover:text-primary transition-colors"
            >
              {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
            </button>
          )}
          {post.shares > 0 && (
            <>
              <span className="mx-1">·</span>
              <span>{post.shares} share{post.shares !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 py-2 flex items-center gap-1 border-t border-surface-border">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${post.isLiked
                ? "text-red-500 bg-red-50"
                : "text-gray-500 hover:bg-gray-100"
              }`}
          >
            <Heart size={15} className={post.isLiked ? "fill-red-500" : ""} />
            {post.isLiked ? "Liked" : "Like"}
          </button>

          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MessageCircle size={15} />
            Comment
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Share2 size={15} />
            Share
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t border-surface-border px-4 py-3 space-y-3 bg-gray-50/50">
            {/* Comment input */}
            <div className="flex gap-2.5">
              <Avatar src={user?.profilePic} name={user?.name} size="xs" />
              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  {replyingTo && (
                    <div className="flex items-center gap-1 text-[10px] text-primary mb-1">
                      <span>Replying to {replyingTo.user?.name}</span>
                      <button onClick={() => setReplyingTo(null)}>
                        <X size={10} />
                      </button>
                    </div>
                  )}
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
                    placeholder={replyingTo ? `Reply to ${replyingTo.user?.name}...` : "Write a comment..."}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="self-end p-2 rounded-xl bg-primary text-white hover:bg-primary-950 disabled:opacity-40 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>

            {/* Comments list */}
            {commentsLoading && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!commentsLoading && comments.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-2">
                No comments yet. Be the first!
              </p>
            )}

            <div className="space-y-3">
              {comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  postId={post._id}
                  onReply={setReplyingTo}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareModal postId={post._id} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
}