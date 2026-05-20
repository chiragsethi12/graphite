import { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, Video, Phone, MoreVertical, ArrowLeft, Image, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";
import {
  useMessageThread,
  useSendMessage,
  useMarkConversationRead,
} from "../../hooks/useMessages";
import Avatar from "../ui/Avatar";

function MessageBubble({ msg, isMine }) {
  const timeStr = new Date(msg.createdAt || Date.now()).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {!isMine && (
        <Avatar
          src={msg.sender?.profilePic}
          name={msg.sender?.name}
          size="xs"
        />
      )}
      <div
        className={`max-w-[70%] rounded-2xl text-sm leading-relaxed ${isMine
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white border border-surface-border text-gray-800 rounded-bl-sm shadow-card"
          }`}
      >
        {/* Attachment image */}
        {msg.attachment?.url && (
          <div className={`${msg.content ? "" : ""}`}>
            <img
              src={msg.attachment.url}
              alt="Attachment"
              className={`max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                msg.content ? "rounded-t-2xl" : "rounded-2xl"
              }`}
              onClick={() => window.open(msg.attachment.url, "_blank")}
            />
          </div>
        )}
        {/* Text content */}
        {msg.content && (
          <div className="px-4 py-2.5">
            {msg.content}
          </div>
        )}
        {/* Timestamp + read receipt */}
        <div className={`px-4 pb-2 ${!msg.content && msg.attachment?.url ? "pt-1" : ""} text-[10px] ${isMine ? "text-white/60 text-right" : "text-gray-400"}`}>
          {timeStr}
          {isMine && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ conversation, onBack }) {
  const { user, onlineUsers } = useAuth();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const typingDebounce = useRef(null);
  const fileInputRef = useRef(null);

  const recipientId = conversation?.participant?._id;
  const isOnline = recipientId && onlineUsers.includes(recipientId);

  const { data, isLoading, fetchNextPage, hasNextPage } = useMessageThread(recipientId);
  const sendMessage = useSendMessage(recipientId);
  const markRead = useMarkConversationRead(recipientId);

  // Flatten pages of messages (oldest first)
  const allMessages = data?.pages?.flatMap((p) => p.messages) || [];

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (recipientId && conversation?.unread > 0) {
      markRead.mutate();
    }
  }, [recipientId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  // Typing indicator via socket
  useEffect(() => {
    if (!recipientId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleTyping = ({ userId }) => {
      if (userId === recipientId) {
        setIsTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 2500);
      }
    };

    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", ({ userId }) => {
      if (userId === recipientId) setIsTyping(false);
    });

    return () => {
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping");
    };
  }, [recipientId]);

  // Clean up image preview on unmount or conversation change
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !imageFile) return;
    if (sendMessage.isPending) return;

    if (imageFile) {
      // Send as FormData for multer
      const formData = new FormData();
      if (trimmed) formData.append("content", trimmed);
      formData.append("image", imageFile);
      sendMessage.mutate(formData);
    } else {
      sendMessage.mutate(trimmed);
    }

    setInput("");
    removeImage();

    // Stop typing indicator
    const socket = getSocket();
    if (socket && recipientId) {
      socket.emit("stopTyping", { recipientId });
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Debounced typing indicator
    const socket = getSocket();
    if (socket && recipientId) {
      socket.emit("typing", { recipientId });
      clearTimeout(typingDebounce.current);
      typingDebounce.current = setTimeout(() => {
        socket.emit("stopTyping", { recipientId });
      }, 2000);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Send size={24} className="text-primary" />
          </div>
          <p className="font-medium text-gray-600">Select a conversation</p>
          <p className="text-sm text-gray-400 mt-1">Choose from your messages on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border bg-white">
        <div className="flex items-center gap-3">
          {/* Back button — visible on mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="relative">
            <Avatar
              src={conversation.participant?.profilePic}
              name={conversation.participant?.name}
              size="md"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {conversation.participant?.name}
            </p>
            <p className="text-xs text-gray-400">
              {isOnline ? (
                <span className="text-green-600 font-medium">Online</span>
              ) : (
                conversation.participant?.headline || "Offline"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {/* Load older messages */}
        {hasNextPage && (
          <div className="text-center">
            <button
              onClick={() => fetchNextPage()}
              className="text-xs text-primary hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && allMessages.length === 0 && (
          <div className="text-center text-xs text-gray-400 mt-8">
            Start your conversation with {conversation.participant?.name}
          </div>
        )}

        {allMessages.map((msg) => {
          const senderId = msg.sender?._id || msg.sender;
          const isMine = senderId === user?._id;
          return <MessageBubble key={msg._id} msg={msg} isMine={isMine} />;
        })}

        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar
              src={conversation.participant?.profilePic}
              name={conversation.participant?.name}
              size="xs"
            />
            <div className="bg-white border border-surface-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-card">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Image preview bar */}
      {imagePreview && (
        <div className="border-t border-surface-border bg-white px-4 py-2 flex items-center gap-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-900"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-xs text-gray-500">{imageFile?.name}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-surface-border bg-white px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-primary transition-colors"
          >
            <Image size={17} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Write a message..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
          />
          <button className="text-gray-400 hover:text-primary">
            <Smile size={17} />
          </button>
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || sendMessage.isPending}
            className="ml-1 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-950 disabled:opacity-40 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}