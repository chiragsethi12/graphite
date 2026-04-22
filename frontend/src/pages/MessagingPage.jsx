import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";

// Mock conversations for UI dev — replace with real API when backend messaging is ready
const MOCK_CONVERSATIONS = [
  {
    _id: "c1",
    participant: { _id: "u1", name: "Elena Rodriguez", profilePic: "" },
    lastMessage: "The Q3 strategy looks solid. Let's connect tomorrow to finalize.",
    lastMessageAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    online: true,
    unread: 2,
  },
  {
    _id: "c2",
    participant: { _id: "u2", name: "Marcus Chen", profilePic: "" },
    lastMessage: "Thanks for the introduction!",
    lastMessageAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    online: false,
    unread: 0,
  },
  {
    _id: "c3",
    participant: { _id: "gs", name: "Graphite Support", profilePic: "" },
    lastMessage: "Your premium subscription is now active.",
    lastMessageAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    online: false,
    unread: 0,
  },
  {
    _id: "c4",
    participant: { _id: "u3", name: "Sarah Jenkins", profilePic: "" },
    lastMessage: "Did you see the new hire announcement?",
    lastMessageAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    online: false,
    unread: 0,
  },
];

export default function MessagingPage() {
  const [activeConversation, setActiveConversation] = useState(MOCK_CONVERSATIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_CONVERSATIONS.filter((c) =>
    c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-[1100px] mx-auto -mt-6 -mx-4 lg:-mx-6">
        <div className="flex h-[calc(100vh-60px)] bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
          {/* Conversation panel */}
          <div className="w-[300px] flex-shrink-0 border-r border-surface-border">
            <ConversationList
              conversations={filtered}
              activeId={activeConversation?._id}
              onSelect={setActiveConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Chat window */}
          <ChatWindow conversation={activeConversation} />
        </div>
      </div>
    </MainLayout>
  );
}
