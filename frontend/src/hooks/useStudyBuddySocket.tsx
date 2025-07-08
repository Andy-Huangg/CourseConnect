import { useEffect, useRef, useCallback } from "react";

interface StudyBuddy {
  id: number;
  courseId: number;
  courseName?: string;
  isOptedIn: boolean;
  buddy?: {
    id: number;
    username: string;
    displayName: string;
  };
  matchedAt?: string;
  contactPreference?: string;
}

export interface StudyBuddyUpdateMessage {
  type: "STUDY_BUDDY_UPDATE";
  userId: number;
  courseId: number;
  updateType: "MATCHED" | "DISCONNECTED" | "OPTED_IN" | "OPTED_OUT";
  studyBuddy?: StudyBuddy;
}

export function useStudyBuddySocket(
  onStudyBuddyUpdate: (update: StudyBuddyUpdateMessage) => void
) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem("jwt");
    if (!token) return;

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Connect to course 1 (Global) to receive study buddy updates for all courses
    const wsUrl = `${import.meta.env.VITE_WS_URL}?courseId=1&token=${token}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("Study buddy WebSocket connected");
      reconnectAttemptsRef.current = 0;
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "STUDY_BUDDY_UPDATE") {
          onStudyBuddyUpdate(data as StudyBuddyUpdateMessage);
        }
      } catch {
        // Handle non-JSON messages (like USER_COUNT messages)
        console.log("Non-JSON WebSocket message:", event.data);
      }
    };

    socketRef.current.onclose = () => {
      console.log("Study buddy WebSocket disconnected");

      // Attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < 5) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("Study buddy WebSocket error:", error);
    };
  }, [onStudyBuddyUpdate]);

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

  return { isConnected: socketRef.current?.readyState === WebSocket.OPEN };
}
