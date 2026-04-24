import { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, Video, Phone, MoreVertical } from "lucide-react";
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
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white border border-surface-border text-gray-800 rounded-bl-sm shadow-card"
          }`}
      >
        {/* msg.content is the correct field name from the Message model */}
        {msg.content}
        <div className={`text-[10px] mt-1 ${isMine ? "text-white/60 text-right" : "text-gray-400"}`}>
          {timeStr}
          {isMine && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const recipientId = conversation?.participant?._id;

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

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;

    sendMessage.mutate(trimmed);
    setInput("");

    // Stop typing indicator
    const socket = getSocket();
    if (socket && recipientId) {
      socket.emit("stopTyping", { recipientId });
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Emit typing indicator
    const socket = getSocket();
    if (socket && recipientId) {
      socket.emit("typing", { recipientId });
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
          <Avatar
            src={conversation.participant?.profilePic}
            name={conversation.participant?.name}
            size="md"
          />
          <div>
            <p className="font-semibold text-sm text-gray-900">
              {conversation.participant?.name}
            </p>
            <p className="text-xs text-gray-400">
              {conversation.participant?.headline}
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

      {/* Input */}
      <div className="border-t border-surface-border bg-white px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <button className="text-gray-400 hover:text-primary">
            <Paperclip size={17} />
          </button>
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
            disabled={!input.trim() || sendMessage.isPending}
            className="ml-1 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-950 disabled:opacity-40 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}