import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isLiked = post.likes?.some?.((id) => id === user?._id || id?._id === user?._id);
  const isOwner = post.author?._id === user?._id;

  const likeMutation = useMutation({
    mutationFn: () => api.put(`/posts/${post._id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post._id}/comment`, { content: comment }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("Failed to comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/posts/${post._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post deleted");
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => api.post(`/posts/${post._id}/share`, { content: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post shared to your feed!");
    },
    onError: () => toast.error("Failed to share"),
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    toast.success("Link copied!");
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
      {/* Shared post header */}
      {post.type === "share" && post.sharedPost && (
        <div className="px-4 pt-3 pb-1 text-xs text-gray-400 flex items-center gap-1">
          <Share2 size={12} /> {post.author?.name} shared a post
        </div>
      )}

      {/* Author */}
      <div className="flex items-start justify-between p-4 pb-2">
        <Link to={`/profile/${post.author?.username || post.author?._id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar src={post.author?.profilePic} name={post.author?.name} size="md" />
          <div>
            <p className="font-semibold text-sm text-gray-900">{post.author?.name}</p>
            <p className="text-xs text-gray-400">
              {post.author?.headline} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        <div className="relative">
          <button onClick={() => setShowMenu((p) => !p)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
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

      {/* Actions bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => likeMutation.mutate()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isLiked ? "text-primary bg-primary-50" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Heart size={15} className={isLiked ? "fill-primary" : ""} />
            {post.likes?.length > 0 && <span>{post.likes.length}</span>}
          </button>
          <button
            onClick={() => setShowComments((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MessageCircle size={15} />
            {post.comments?.length > 0 && <span>{post.comments.length}</span>}
          </button>
          <button
            onClick={() => shareMutation.mutate()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Share2 size={15} />
            {post.shares > 0 && <span>{post.shares}</span>}
          </button>
        </div>
        <button onClick={handleCopyLink} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bookmark size={15} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {post.comments?.slice(0, 8).map((c) => (
            <div key={c._id} className="flex gap-2.5">
              <Avatar src={c.user?.profilePic} name={c.user?.name} size="xs" />
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-gray-800">{c.user?.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2.5 mt-2">
            <Avatar src={user?.profilePic} name={user?.name} size="xs" />
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && comment.trim() && commentMutation.mutate()}
                placeholder="Add a comment..."
                className="flex-1 text-xs bg-transparent focus:outline-none"
              />
              <button
                onClick={() => comment.trim() && commentMutation.mutate()}
                disabled={!comment.trim()}
                className="text-primary disabled:opacity-30"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
