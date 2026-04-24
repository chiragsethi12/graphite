import { useState, useRef } from "react";
import { Image, X, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import toast from "react-hot-toast";

export default function CreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!content.trim() && !image) {
        throw new Error("Post must have content or an image");
      }
      const fd = new FormData();
      fd.append("content", content);
      if (image) fd.append("image", image);
      return api.post("/posts/create", fd);
    },
    onSuccess: () => {
      setContent("");
      setImage(null);
      setPreview(null);
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success("Post published!");
    },
    onError: (err) => toast.error(err.message || "Failed to publish post"),
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
          />

          {preview && (
            <div className="relative mt-2 rounded-xl overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 w-full object-cover rounded-xl"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              >
                <X size={14} />
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
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setContent("");
                    setImage(null);
                    setPreview(null);
                    setIsExpanded(false);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => mutation.mutate()}
                  loading={mutation.isPending}
                  disabled={!content.trim() && !image}
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