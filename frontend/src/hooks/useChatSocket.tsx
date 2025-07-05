import { useEffect, useRef, useState, useCallback } from "react";

interface ChatMessage {
  id: number;
  senderId: string;
  displayName: string;
  content: string;
  isAnonymous: boolean;
  timestamp: string;
  courseId: number;
}

// Cache for chat histories to avoid refetching
const chatHistoryCache = new Map<number, string[]>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const cacheTimestamps = new Map<number, number>();

export function useChatSocket(url: string | null, courseId: number | null, isAnonymous: boolean = false) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Function to fetch chat history from API with caching
  const fetchChatHistory = useCallback(async (courseId: number) => {
    // Check cache first
    const cachedHistory = chatHistoryCache.get(courseId);
    const cacheTime = cacheTimestamps.get(courseId);

    if (cachedHistory && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      setMessages(cachedHistory);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Chat/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const chatHistory: ChatMessage[] = await response.json();
        // Convert chat messages to display format using DisplayName
        const messageTexts = chatHistory.map(
          (msg) => `${msg.displayName}: ${msg.content}`
        );

        // Cache the results
        chatHistoryCache.set(courseId, messageTexts);
        cacheTimestamps.set(courseId, Date.now());

        setMessages(messageTexts);
      } else {
        console.error("Failed to fetch chat history:", response.statusText);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket connection with auto-reconnect
  const connectWebSocket = useCallback(() => {
    if (!courseId || !url) return;

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    const token = localStorage.getItem("jwt");
    const urlWithToken = url.includes("token=")
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}token=${token}`;

    // Add anonymous parameter to URL
    const finalUrl = `${urlWithToken}&anonymous=${isAnonymous}`;

    socketRef.current = new WebSocket(finalUrl);

    socketRef.current.onopen = () => {
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    };

    socketRef.current.onmessage = (event) => {
      const data = event.data;

      if (data.startsWith("USER_COUNT:")) {
        const count = parseInt(data.replace("USER_COUNT:", ""));
        setConnectedUsers(count);
      } else if (data.startsWith("MESSAGE:")) {
        const message = data.replace("MESSAGE:", "");
        setMessages((prev) => {
          const newMessages = [...prev, message];
          // Update cache with new message
          if (courseId) {
            chatHistoryCache.set(courseId, newMessages);
            cacheTimestamps.set(courseId, Date.now());
          }
          return newMessages;
        });
      } else {
        // Fallback for old format messages
        setMessages((prev) => {
          const newMessages = [...prev, data];
          if (courseId) {
            chatHistoryCache.set(courseId, newMessages);
            cacheTimestamps.set(courseId, Date.now());
          }
          return newMessages;
        });
      }
    };

    socketRef.current.onclose = (event) => {
      // Auto-reconnect with exponential backoff (unless manually closed)
      if (event.code !== 1000 && reconnectAttemptsRef.current < 5) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          30000
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connectWebSocket();
        }, delay);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [url, courseId, isAnonymous]);

  useEffect(() => {
    // Clear messages and user count when course changes
    setMessages([]);
    setConnectedUsers(0);

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (!courseId || !url) {
      return;
    }

    // Fetch previous messages for the new course
    fetchChatHistory(courseId);

    // Connect WebSocket
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000); // Normal closure
      }
    };
  }, [url, courseId, fetchChatHistory, connectWebSocket]);

  // Separate effect to handle anonymous mode changes without refetching chat history
  useEffect(() => {
    // Only reconnect if we already have an active connection and anonymous mode changed
    if (socketRef.current && courseId && url) {
      // Close existing connection and reconnect with new anonymous mode
      connectWebSocket();
    }
  }, [isAnonymous, connectWebSocket, courseId, url]);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && message.trim()) {
      socketRef.current.send(message.trim());
    }
  }, []);

  return { messages, sendMessage, isLoading, connectedUsers };
}
