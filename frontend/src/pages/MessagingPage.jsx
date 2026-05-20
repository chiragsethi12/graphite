import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useConversations, useMessageSocket } from "../hooks/useMessages";
import MainLayout from "../components/layout/MainLayout";
import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";

export default function MessagingPage() {
  const { user, clearMessageCount, fetchUnreadMessageCount } = useAuth();
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChat, setShowChat] = useState(false); // mobile: toggle list vs chat

  const { data, isLoading } = useConversations();
  const conversations = data?.conversations || [];

  // Subscribe to real-time new messages
  useMessageSocket(activeConversation?.participant?._id);

  // Clear unread badge when entering the page
  useEffect(() => {
    clearMessageCount();
    return () => {
      // Refresh unread count when leaving the page
      fetchUnreadMessageCount();
    };
  }, []);

  // Auto-select the first conversation on desktop
  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowChat(true); // On mobile, switch to chat view
    clearMessageCount();
  };

  const handleBack = () => {
    setShowChat(false); // On mobile, go back to list
  };

  const filtered = conversations.filter((c) =>
    c.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-[1100px] mx-auto -mt-6 -mx-4 lg:-mx-6">
        <div className="flex h-[calc(100vh-60px)] bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
          {/* Conversation panel — hidden on mobile when chat is open */}
          <div className={`w-full lg:w-[300px] flex-shrink-0 border-r border-surface-border ${showChat ? "hidden lg:block" : "block"}`}>
            <ConversationList
              conversations={filtered}
              activeId={activeConversation?._id}
              onSelect={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
            />
          </div>

          {/* Chat window — hidden on mobile when list is shown */}
          <div className={`flex-1 min-w-0 ${!showChat ? "hidden lg:flex" : "flex"}`}>
            <ChatWindow
              conversation={activeConversation}
              onBack={handleBack}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}