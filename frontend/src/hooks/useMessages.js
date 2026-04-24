import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "../lib/axios";
import { getSocket } from "../lib/socket";

/**
 * Hook to fetch conversation list for the current user.
 */
export function useConversations() {
    return useQuery({
        queryKey: ["conversations"],
        queryFn: () => api.get("/messages/conversations").then((r) => r.data),
        refetchInterval: 30000, // Refresh every 30s as fallback
    });
}

/**
 * Hook to fetch message thread between current user and another user.
 * Uses cursor-based infinite loading (newer → older on scroll up).
 */
export function useMessageThread(userId) {
    return useInfiniteQuery({
        queryKey: ["messages", userId],
        queryFn: ({ pageParam }) => {
            const params = new URLSearchParams({ limit: "30" });
            if (pageParam) params.set("cursor", pageParam);
            return api.get(`/messages/${userId}?${params}`).then((r) => r.data);
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: null,
        enabled: !!userId,
    });
}

/**
 * Hook to send a message to a user.
 */
export function useSendMessage(recipientId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (content) =>
            api.post(`/messages/${recipientId}`, { content }).then((r) => r.data),
        onSuccess: (data) => {
            // Prepend the new message optimistically into the thread cache
            queryClient.setQueryData(["messages", recipientId], (old) => {
                if (!old) return old;
                const newPages = [...old.pages];
                if (newPages[0]) {
                    newPages[0] = {
                        ...newPages[0],
                        messages: [...newPages[0].messages, data.message],
                    };
                }
                return { ...old, pages: newPages };
            });
            // Refresh conversations sidebar
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
}

/**
 * Hook to mark all messages in a conversation as read.
 */
export function useMarkConversationRead(userId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.put(`/messages/${userId}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
}

/**
 * Hook that subscribes to real-time new messages via Socket.io.
 * Call this once at the MessagingPage level.
 */
export function useMessageSocket(activeUserId) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNewMessage = (message) => {
            const senderId = message.sender?._id || message.sender;

            // If the message is from the currently active conversation, append it
            if (senderId === activeUserId) {
                queryClient.setQueryData(["messages", activeUserId], (old) => {
                    if (!old) return old;
                    const newPages = [...old.pages];
                    if (newPages[0]) {
                        newPages[0] = {
                            ...newPages[0],
                            messages: [...newPages[0].messages, message],
                        };
                    }
                    return { ...old, pages: newPages };
                });
            }

            // Always refresh the conversations sidebar for the preview + unread count
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        };

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [activeUserId, queryClient]);
}