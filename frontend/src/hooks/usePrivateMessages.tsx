import { useState, useEffect, useCallback } from "react";
import {
  usePrivateMessageSocket,
  type PrivateMessageUpdateData,
} from "./usePrivateMessageSocket";

export interface PrivateMessage {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  timestamp: string;
  editedAt?: string;
  isRead: boolean;
}

export function usePrivateMessages(
  recipientId?: number,
  token?: string | null
) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const jwtToken = token || localStorage.getItem("jwt");
    return {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  const fetchMessages = useCallback(
    async (withUserId: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/PrivateMessage/with/${withUserId}`,
          {
            headers: getHeaders(),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.reverse()); // Reverse to show chronological order
        } else if (response.status === 403) {
          setError("You can only message your study buddies");
        } else {
          throw new Error("Failed to fetch messages");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch messages"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders]
  );

  const sendMessage = useCallback(
    async (recipientId: number, content: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/PrivateMessage`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              recipientId,
              content,
            }),
          }
        );

        if (response.ok) {
          // Don't update local state - WebSocket will handle real-time updates
          return { success: true };
        } else if (response.status === 403) {
          return {
            success: false,
            error: "You can only message your study buddies",
          };
        } else {
          throw new Error("Failed to send message");
        }
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to send message",
        };
      }
    },
    [getHeaders]
  );

  const editMessage = useCallback(
    async (messageId: number, content: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/PrivateMessage/${messageId}`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ content }),
          }
        );

        if (response.ok) {
          // Don't update local state - WebSocket will handle real-time updates
          return { success: true };
        } else {
          throw new Error("Failed to edit message");
        }
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to edit message",
        };
      }
    },
    [getHeaders]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/PrivateMessage/${messageId}`,
          {
            method: "DELETE",
            headers: getHeaders(),
          }
        );

        if (response.ok) {
          // Don't update local state - WebSocket will handle real-time updates
          return { success: true };
        } else {
          throw new Error("Failed to delete message");
        }
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to delete message",
        };
      }
    },
    [getHeaders]
  );

  // WebSocket integration for real-time updates
  const handlePrivateMessageUpdate = useCallback(
    (update: PrivateMessageUpdateData) => {
      const getCurrentUserId = () => {
        try {
          const jwtToken = token || localStorage.getItem("jwt");
          if (!jwtToken) return null;

          const payload = JSON.parse(atob(jwtToken.split(".")[1]));
          return parseInt(payload.userId); // Use the userId claim which contains the actual numeric user ID
        } catch {
          return null;
        }
      };

      const currentUserId = getCurrentUserId();

      switch (update.type) {
        case "PRIVATE_MESSAGE_NEW":
          if (update.message) {
            const message = update.message;
            // Add message if it's part of the current conversation:
            // - Current user is the sender and recipient is the selected buddy, OR
            // - Current user is the recipient and sender is the selected buddy
            if (
              recipientId &&
              currentUserId &&
              ((message.senderId === currentUserId &&
                message.recipientId === recipientId) ||
                (message.senderId === recipientId &&
                  message.recipientId === currentUserId))
            ) {
              setMessages((prev) => {
                // Check if message already exists to avoid duplicates
                if (prev.some((m) => m.id === message.id)) {
                  return prev;
                }
                return [...prev, message];
              });
            }
          }
          break;

        case "PRIVATE_MESSAGE_UPDATED":
          if (update.message) {
            const message = update.message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === message.id ? message : msg))
            );
          }
          break;

        case "PRIVATE_MESSAGE_DELETED":
          if (update.messageId) {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== update.messageId)
            );
          }
          break;

        case "PRIVATE_MESSAGE_READ":
          if (update.messageId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === update.messageId ? { ...msg, isRead: true } : msg
              )
            );
          }
          break;
      }
    },
    [recipientId, token]
  );

  // Only connect to WebSocket if we have a recipient
  usePrivateMessageSocket(recipientId ? handlePrivateMessageUpdate : null);

  const markAsRead = useCallback(
    async (messageId: number) => {
      try {
        // Check if message is already read to avoid unnecessary requests
        const message = messages.find((m) => m.id === messageId);
        if (message && message.isRead) {
          return; // Already read, no need to make request
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/PrivateMessage/${messageId}/read`,
          {
            method: "POST",
            headers: getHeaders(),
          }
        );

        if (response.ok) {
          // Update local state immediately for better UX
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, isRead: true } : msg
            )
          );
        } else {
          // Don't spam the console with errors - the WebSocket will handle updates
        }
      } catch {
        // Reduced logging to prevent console spam
      }
    },
    [messages, getHeaders]
  );

  // Auto-fetch messages when recipientId changes
  useEffect(() => {
    if (recipientId) {
      fetchMessages(recipientId);
    }
  }, [recipientId, fetchMessages]);

  // Only fetch unread counts when we have a recipient and for specific message updates
  // The global unread counts are handled by a separate hook

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    fetchMessages,
  };
}
