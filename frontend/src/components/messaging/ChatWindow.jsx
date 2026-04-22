import { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, Video, Phone, MoreVertical } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../lib/socket";
import Avatar from "../ui/Avatar";

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {!isMine && <Avatar src={msg.sender?.profilePic} name={msg.sender?.name} size="xs" />}
      <div
        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? "bg-primary text-white rounded-br-sm"
            : "bg-white border border-surface-border text-gray-800 rounded-bl-sm shadow-card"
        }`}
      >
        {msg.text}
        <div className={`text-[10px] mt-1 ${isMine ? "text-primary-200 text-right" : "text-gray-400"}`}>
          {new Date(msg.createdAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          {isMine && <span className="ml-1">✓✓</span>}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (!conversation) return;
    setMessages([]);

    socket.emit("join-room", conversation._id);
    socket.on("message", (msg) => setMessages((p) => [...p, msg]));
    socket.on("typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 2000);
    });

    return () => {
      socket.off("message");
      socket.off("typing");
    };
  }, [conversation?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = {
      _id: Date.now().toString(),
      text: input,
      sender: user,
      createdAt: new Date().toISOString(),
      roomId: conversation._id,
    };
    socket.emit("send-message", msg);
    setMessages((p) => [...p, msg]);
    setInput("");
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
          <Avatar src={conversation.participant?.profilePic} name={conversation.participant?.name} size="md" online={conversation.online} />
          <div>
            <p className="font-semibold text-sm text-gray-900">{conversation.participant?.name}</p>
            <p className={`text-xs ${conversation.online ? "text-green-500" : "text-gray-400"}`}>
              {conversation.online ? "● Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Video size={18} /></button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Phone size={18} /></button>
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-xs text-gray-400 mt-8">
            Start your conversation with {conversation.participant?.name}
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg._id} msg={msg} isMine={msg.sender?._id === user?._id || msg.sender === user?._id} />
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <Avatar src={conversation.participant?.profilePic} name={conversation.participant?.name} size="xs" />
            <div className="bg-white border border-surface-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-card">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
          <button className="text-gray-400 hover:text-primary"><Paperclip size={17} /></button>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              socket.emit("typing", { roomId: conversation._id });
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Write a message..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
          />
          <button className="text-gray-400 hover:text-primary"><Smile size={17} /></button>
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="ml-1 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-950 disabled:opacity-40 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
        <div className="flex gap-4 mt-2 px-1">
          <button className="text-[11px] text-gray-400 flex items-center gap-1 hover:text-primary">📎 Attach File</button>
          <button className="text-[11px] text-gray-400 flex items-center gap-1 hover:text-primary">🖼️ Send Image</button>
        </div>
      </div>
    </div>
  );
}
