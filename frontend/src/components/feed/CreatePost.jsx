import { useState, useRef } from "react";
import { Image, X, Send, Loader2, Bold, Italic } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

const MAX_CHARS = 3000;
const WARN_THRESHOLD = 0.8; // 80%

export default function CreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const charCount = content.length;
  const charPercent = charCount / MAX_CHARS;
  const isOverLimit = charCount > MAX_CHARS;
  const isWarning = charPercent >= WARN_THRESHOLD && !isOverLimit;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!content.trim() && !image) {
        throw new Error("Post must have content or an image");
      }
      const fd = new FormData();
      if (content.trim()) fd.append("content", content.trim());
      if (image) fd.append("image", image);
      return api.post("/posts/create", fd);
    },
    onSuccess: () => {
      setContent("");
      setImage(null);
      setPreview(null);
      setIsExpanded(false);
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success("Post published!");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to publish post";
      setUploadError(msg);
      toast.error(msg);
    },
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Type check
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
      e.target.value = "";
      return;
    }

    // Size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      e.target.value = "";
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setUploadError(null);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (isOverLimit) {
      toast.error(`Post must be under ${MAX_CHARS} characters`);
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-4">
      <div className="flex gap-3">
        <Avatar src={user?.profilePic} name={user?.name} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder={`What's on your mind, ${user?.name?.split(" ")[0]}?`}
            rows={isExpanded ? 4 : 2}
            maxLength={MAX_CHARS + 100} // Allow typing past for UX, but enforce via UI
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
          />

          {/* Character counter — always visible when expanded */}
          {isExpanded && (
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[10px] text-gray-300">
                Use <span className="font-mono">**bold**</span> and <span className="font-mono">*italic*</span> for formatting
              </p>
              <p
                className={`text-[10px] font-medium tabular-nums transition-colors ${
                  isOverLimit
                    ? "text-red-500 font-bold"
                    : isWarning
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
              </p>
            </div>
          )}

          {/* Image preview */}
          {preview && (
            <div className="relative mt-2 rounded-xl overflow-hidden group">
              {mutation.isPending && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="text-white animate-spin" />
                    <span className="text-xs text-white/80 font-medium">Uploading…</span>
                  </div>
                </div>
              )}
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 w-full object-cover rounded-xl"
              />
              {!mutation.isPending && (
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Upload error */}
          {uploadError && !mutation.isPending && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs">
              <span>{uploadError}</span>
              <button
                onClick={() => { setUploadError(null); mutation.mutate(); }}
                className="font-semibold underline hover:no-underline ml-auto"
              >
                Retry
              </button>
            </div>
          )}

          {isExpanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Image size={15} />
                  Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setContent("");
                    setImage(null);
                    setPreview(null);
                    setIsExpanded(false);
                    setUploadError(null);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  loading={mutation.isPending}
                  disabled={(!content.trim() && !image) || isOverLimit}
                >
                  <Send size={14} /> Publish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}