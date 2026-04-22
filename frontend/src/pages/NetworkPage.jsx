import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, X, UserPlus, Users, Clock, Send } from "lucide-react";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";

function PersonCard({ person, onConnect, loading }) {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5 flex flex-col items-center text-center gap-3 hover:shadow-card-hover transition-shadow">
      <Link to={`/profile/${person.username || person._id}`}>
        <Avatar src={person.profilePic} name={person.name} size="lg" />
      </Link>
      <div>
        <Link to={`/profile/${person.username || person._id}`} className="font-semibold text-gray-900 text-sm hover:text-primary transition-colors">
          {person.name}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{person.headline}</p>
        {person.mutualCount > 0 && (
          <p className="text-[11px] text-gray-400 mt-1">
            <Users size={10} className="inline mr-1" />
            {person.mutualCount} mutual connection{person.mutualCount !== 1 ? "s" : ""}
          </p>
        )}
        {person.sharedSkills > 0 && (
          <p className="text-[10px] text-primary mt-0.5">{person.sharedSkills} shared skill{person.sharedSkills !== 1 ? "s" : ""}</p>
        )}
      </div>
      <Button variant="outline" size="sm" fullWidth onClick={() => onConnect(person._id)} loading={loading}>
        <UserPlus size={13} /> Connect
      </Button>
    </div>
  );
}

function PendingCard({ conn, onRespond }) {
  const sender = conn.sender;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
      <Link to={`/profile/${sender?.username || sender?._id}`} className="flex items-center gap-3">
        <Avatar src={sender?.profilePic} name={sender?.name} size="md" />
        <div>
          <p className="font-semibold text-sm text-gray-900">{sender?.name}</p>
          <p className="text-xs text-gray-500">{sender?.headline}</p>
        </div>
      </Link>
      <div className="flex gap-2">
        <button
          onClick={() => onRespond(conn._id, "accept")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-950 transition-colors"
        >
          <Check size={13} /> Accept
        </button>
        <button
          onClick={() => onRespond(conn._id, "reject")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          <X size={13} /> Ignore
        </button>
      </div>
    </div>
  );
}

function SentCard({ conn, onWithdraw }) {
  const recipient = conn.recipient;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
      <Link to={`/profile/${recipient?.username || recipient?._id}`} className="flex items-center gap-3">
        <Avatar src={recipient?.profilePic} name={recipient?.name} size="md" />
        <div>
          <p className="font-semibold text-sm text-gray-900">{recipient?.name}</p>
          <p className="text-xs text-gray-500">{recipient?.headline}</p>
        </div>
      </Link>
      <button
        onClick={() => onWithdraw(recipient._id)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
      >
        <X size={13} /> Withdraw
      </button>
    </div>
  );
}

export default function NetworkPage() {
  const queryClient = useQueryClient();

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.get("/users/suggestions").then((r) => r.data),
  });

  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: () => api.get("/connections/pending").then((r) => r.data),
  });

  const { data: sentData } = useQuery({
    queryKey: ["sentRequests"],
    queryFn: () => api.get("/connections/sent").then((r) => r.data),
  });

  const { data: connectionsData } = useQuery({
    queryKey: ["connections"],
    queryFn: () => api.get("/connections").then((r) => r.data),
  });

  const connectMutation = useMutation({
    mutationFn: (id) => api.post(`/connections/request/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      toast.success("Connection request sent!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to send request"),
  });

  const respondMutation = useMutation({
    mutationFn: ({ connectionId, action }) =>
      api.put(`/connections/respond/${connectionId}`, { action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success(action === "accept" ? "Connection accepted!" : "Request ignored");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (recipientId) => api.delete(`/connections/withdraw/${recipientId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Request withdrawn");
    },
  });

  const suggestions  = suggestionsData?.users || [];
  const pending      = pendingData?.requests || [];
  const sent         = sentData?.requests || [];
  const connections  = connectionsData?.connections || [];

  return (
    <MainLayout>
      <div className="max-w-[960px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Network</h1>
          <p className="text-sm text-gray-500 mt-1">
            {connections.length} connection{connections.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <Card>
            <h2 className="font-bold text-gray-900 p-4 pb-0">
              Pending Invitations <span className="text-primary ml-1">({pending.length})</span>
            </h2>
            <div className="divide-y divide-gray-100">
              {pending.map((conn) => (
                <PendingCard
                  key={conn._id}
                  conn={conn}
                  onRespond={(connectionId, action) => respondMutation.mutate({ connectionId, action })}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Sent requests */}
        {sent.length > 0 && (
          <Card>
            <h2 className="font-bold text-gray-900 p-4 pb-0 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              Sent Requests <span className="text-gray-400 ml-1">({sent.length})</span>
            </h2>
            <div className="divide-y divide-gray-100">
              {sent.map((conn) => (
                <SentCard
                  key={conn._id}
                  conn={conn}
                  onWithdraw={(recipientId) => withdrawMutation.mutate(recipientId)}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Suggestions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">People You May Know</h2>
          </div>
          {suggestionsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-card h-48 animate-pulse shadow-card border border-surface-border" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <Card className="text-center py-10 text-gray-400 text-sm">
              No suggestions right now. Check back later!
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggestions.map((person) => (
                <PersonCard
                  key={person._id}
                  person={person}
                  onConnect={(id) => connectMutation.mutate(id)}
                  loading={connectMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current connections */}
        {connections.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3">Your Connections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {connections.map((person) => (
                <Link
                  key={person._id}
                  to={`/profile/${person.username || person._id}`}
                  className="bg-white rounded-card shadow-card border border-surface-border flex items-center justify-between px-4 py-3 hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={person.profilePic} name={person.name} size="md" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{person.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">{person.headline}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => e.preventDefault()}>
                    <Send size={13} /> Message
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
