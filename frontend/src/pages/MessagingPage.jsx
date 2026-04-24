import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useConversations, useMessageSocket } from "../hooks/useMessages";
import MainLayout from "../components/layout/MainLayout";
import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";

export default function MessagingPage() {
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useConversations();
  const conversations = data?.conversations || [];

  // Subscribe to real-time new messages
  useMessageSocket(activeConversation?.participant?._id);

  // Auto-select the first conversation
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  const filtered = conversations.filter((c) =>
    c.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
              isLoading={isLoading}
            />
          </div>

          {/* Chat window */}
          <ChatWindow conversation={activeConversation} />
        </div>
      </div>
    </MainLayout>
  );
}