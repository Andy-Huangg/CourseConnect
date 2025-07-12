import { useEffect, useRef, useCallback } from "react";

export interface CourseNotification {
  type: "COURSE_MESSAGE_NOTIFICATION";
  courseId: number;
  senderId: number;
  senderName: string;
  timestamp: string;
}

export function useGlobalCourseSocket(
  onCourseNotification: ((notification: CourseNotification) => void) | null
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
      console.log("Global course connection already in progress, skipping...");
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
        console.log("Global course already connected, skipping...");
        return;
      }

      // Only close if connection is in a closable state (not already closed or closing)
      if (
        currentState !== WebSocket.CLOSED &&
        currentState !== WebSocket.CLOSING
      ) {
        console.log(
          "Closing existing global course connection before creating new one"
        );
        socketRef.current.close();
      }
    }

    isConnectingRef.current = true;

    try {
      // Connect to Global course (courseId = 1)
      const wsUrl = `${
        import.meta.env.VITE_WS_URL
      }?courseId=1&token=${encodeURIComponent(token)}`;
      console.log("Connecting to Global course WebSocket for notifications...");

      const newSocket = new WebSocket(wsUrl);
      socketRef.current = newSocket;

      newSocket.onopen = () => {
        console.log("Global course WebSocket connected for notifications");
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      newSocket.onmessage = (event) => {
        try {
          const data = event.data;
          console.log("Global course notification received:", data);

          if (data.startsWith("COURSE_NOTIFICATION:")) {
            const notificationJson = data.replace("COURSE_NOTIFICATION:", "");
            const notification: CourseNotification =
              JSON.parse(notificationJson);
            console.log("Parsed course notification:", notification);

            if (onCourseNotification) {
              onCourseNotification(notification);
            }
          }
          // Ignore other message types (USER_COUNT, NEW_MESSAGE, etc.)
        } catch (error) {
          console.error("Error parsing global course notification:", error);
        }
      };

      newSocket.onclose = (event) => {
        console.log(
          "Global course WebSocket connection closed:",
          event.code,
          event.reason
        );
        isConnectingRef.current = false;

        // Only attempt to reconnect if it wasn't a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(
            `Attempting to reconnect to Global course in ${delay}ms (attempt ${
              reconnectAttemptsRef.current + 1
            }/5)`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        }
      };

      newSocket.onerror = (error) => {
        console.error("Global course WebSocket error:", error);
        isConnectingRef.current = false;
      };
    } catch (error) {
      console.error("Error creating Global course WebSocket:", error);
      isConnectingRef.current = false;
    }
  }, [onCourseNotification]);

  // Effect to handle connection lifecycle
  useEffect(() => {
    if (!onCourseNotification) return;

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
  }, [connectWebSocket, closeWebSocket, onCourseNotification]);

  return {
    isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    disconnect: () => {
      closeWebSocket();
    },
  };
}
