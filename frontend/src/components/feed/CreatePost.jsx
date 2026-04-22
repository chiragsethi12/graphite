import { useState, useRef } from "react";
import { Image, FileText, X, Loader } from "lucide-react";
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
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("content", content);
      if (imageFile) fd.append("image", imageFile);
      return api.post("/posts/create", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      setContent("");
      setImageFile(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post shared!");
    },
    onError: () => toast.error("Failed to create post"),
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const canPost = content.trim().length > 0 || imageFile;

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-4">
      <div className="flex gap-3">
        <Avatar src={user?.profilePic} name={user?.name} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an achievement or insight..."
            rows={content.length > 80 ? 4 : 2}
            className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none"
          />
          {preview && (
            <div className="relative mt-2 rounded-lg overflow-hidden">
              <img src={preview} alt="preview" className="max-h-48 w-full object-cover rounded-lg" />
              <button
                onClick={() => { setImageFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Image size={16} className="text-primary" /> Media
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            <FileText size={16} className="text-primary" /> Write
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <Button size="sm" disabled={!canPost} loading={isPending} onClick={() => mutate()}>
          Post
        </Button>
      </div>
    </div>
  );
}
