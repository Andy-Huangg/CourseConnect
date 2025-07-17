import { useEffect, useRef, useCallback } from "react";

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

export interface PrivateMessageUpdateData {
  type:
    | "PRIVATE_MESSAGE_NEW"
    | "PRIVATE_MESSAGE_UPDATED"
    | "PRIVATE_MESSAGE_DELETED"
    | "PRIVATE_MESSAGE_READ"
    | "UNREAD_COUNT_UPDATE";
  message?: PrivateMessage;
  messageId?: number;
  totalUnread?: number;
  unreadByUser?: { [userId: string]: number };
}

export function usePrivateMessageSocket(
  onPrivateMessageUpdate: ((update: PrivateMessageUpdateData) => void) | null
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const cleanupTimeoutRef = useRef<number | null>(null);

  // Function to safely close WebSocket connection
  const closeWebSocket = useCallback(() => {
    if (socketRef.current) {
      const currentState = socketRef.current.readyState;

      // Only close if connection is open or connecting
      if (
        currentState === WebSocket.OPEN ||
        currentState === WebSocket.CONNECTING
      ) {
        socketRef.current.close(1000); // Normal closure
      }

      socketRef.current = null;
    }

    // Reset states
    isConnectingRef.current = false;

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear any pending cleanup timeout
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      return;
    }

    // Check if we already have an active connection
    if (socketRef.current) {
      const currentState = socketRef.current.readyState;

      // If connection is already open or connecting, don't create a new one
      if (
        currentState === WebSocket.OPEN ||
        currentState === WebSocket.CONNECTING
      ) {
        return;
      }

      // Only close if connection is in a closable state (not already closed or closing)
      if (
        currentState !== WebSocket.CLOSED &&
        currentState !== WebSocket.CLOSING
      ) {
        socketRef.current.close(1000);
      }

      // Set to null to ensure we create a fresh connection
      socketRef.current = null;
    }

    // Connect to course 1 (Global) to receive private message updates
    // Private messages are user-specific, not course-specific
    const wsUrl = `${import.meta.env.VITE_WS_URL}?courseId=1&token=${token}`;
    try {
      isConnectingRef.current = true;
      socketRef.current = new WebSocket(wsUrl);
    } catch (error) {
      isConnectingRef.current = false;
      return;
    }

    socketRef.current.onopen = () => {
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type &&
          data.type.startsWith("PRIVATE_MESSAGE_") &&
          onPrivateMessageUpdate
        ) {
          onPrivateMessageUpdate(data as PrivateMessageUpdateData);
        }
      } catch {
        // Handle non-JSON messages (like USER_COUNT messages) silently
        // Don't log these to avoid console spam
      }
    };

    socketRef.current.onclose = (event) => {
      isConnectingRef.current = false;

      // Only attempt to reconnect if it wasn't a clean close
      if (event.code !== 1000 && reconnectAttemptsRef.current < 5) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      }
    };

    socketRef.current.onerror = (error) => {
      isConnectingRef.current = false;
    };
  }, [onPrivateMessageUpdate]);

  useEffect(() => {
    // Only connect if we have a callback function (meaning we actually want to listen to messages)
    if (!onPrivateMessageUpdate) {
      return;
    }

    // Connect with a small delay to prevent rapid reconnection
    cleanupTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, 100);

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      closeWebSocket();
    };
  }, [connectWebSocket, closeWebSocket, onPrivateMessageUpdate]);

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    disconnect: () => {
      closeWebSocket();
    },
  };
}
