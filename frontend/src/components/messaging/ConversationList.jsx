import { Search } from "lucide-react";
import Avatar from "../ui/Avatar";

function timeLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ConversationList({ conversations, activeId, onSelect, searchQuery, onSearchChange }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">Messaging</h2>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-200 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const isActive = conv._id === activeId;
          return (
            <button
              key={conv._id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-l-2 ${
                isActive ? "border-primary bg-primary-50/50" : "border-transparent"
              }`}
            >
              <Avatar src={conv.participant?.profilePic} name={conv.participant?.name} size="md" online={conv.online} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">{conv.participant?.name}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{timeLabel(conv.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </button>
          );
        })}

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-sm">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
