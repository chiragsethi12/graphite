import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

/**
 * Hook for connection status between current user and another user.
 * Returns { status, connectionId, isLoading, sendRequest, withdraw, respond, remove }
 */
export default function useConnectionStatus(userId) {
  const queryClient = useQueryClient();
  const queryKey = ["connectionStatus", userId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get(`/connections/status/${userId}`).then((r) => r.data),
    enabled: !!userId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const sendRequest = useMutation({
    mutationFn: () => api.post(`/connections/request/${userId}`),
    onSuccess: invalidate,
  });

  const withdraw = useMutation({
    mutationFn: () => api.delete(`/connections/withdraw/${userId}`),
    onSuccess: invalidate,
  });

  const respond = useMutation({
    mutationFn: (action) =>
      api.put(`/connections/respond/${data?.connectionId}`, { action }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/connections/${userId}`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return {
    status:       data?.status || "none",
    connectionId: data?.connectionId,
    isLoading,
    sendRequest,
    withdraw,
    respond,
    remove,
  };
}
