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
    | "PRIVATE_MESSAGE_READ";
  message?: PrivateMessage;
  messageId?: number;
}

export function usePrivateMessageSocket(
  onPrivateMessageUpdate: (update: PrivateMessageUpdateData) => void
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    // Close existing connection to prevent duplicates
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return; // Don't create a new connection if one is already open
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    // Connect to course 1 (Global) to receive private message updates
    // Private messages are user-specific, not course-specific
    const wsUrl = `${import.meta.env.VITE_WS_URL}?courseId=1&token=${token}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("Private message WebSocket connected");
      reconnectAttemptsRef.current = 0;
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type && data.type.startsWith("PRIVATE_MESSAGE_")) {
          onPrivateMessageUpdate(data as PrivateMessageUpdateData);
        }
      } catch {
        // Handle non-JSON messages (like USER_COUNT messages) silently
        // Don't log these to avoid console spam
      }
    };

    socketRef.current.onclose = (event) => {
      console.log(
        "Private message WebSocket disconnected",
        event.code,
        event.reason
      );

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
      console.error("Private message WebSocket error:", error);
    };
  }, [onPrivateMessageUpdate]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    disconnect: () => {
      if (socketRef.current) {
        socketRef.current.close(1000); // Normal closure
      }
    },
  };
}
