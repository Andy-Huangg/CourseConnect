import { useEffect, useRef, useState, useCallback } from "react";

interface ChatMessage {
  id: number;
  senderId: string;
  displayName: string;
  content: string;
  isAnonymous: boolean;
  timestamp: string;
  courseId: number;
  editedAt?: string;
  isDeleted: boolean;
}

// Cache for chat histories to avoid refetching
const chatHistoryCache = new Map<number, ChatMessage[]>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const cacheTimestamps = new Map<number, number>();

export function useChatSocket(
  url: string | null,
  courseId: number | null,
  isAnonymous: boolean = false
) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

        // Cache the results
        chatHistoryCache.set(courseId, chatHistory);
        cacheTimestamps.set(courseId, Date.now());

        setMessages(chatHistory);
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
      } else if (data.startsWith("NEW_MESSAGE:")) {
        // Parse the new message JSON
        try {
          const messageJson = data.replace("NEW_MESSAGE:", "");
          const newMessage: ChatMessage = JSON.parse(messageJson);

          setMessages((prev) => {
            const newMessages = [...prev, newMessage];
            // Update cache with new message
            if (courseId) {
              chatHistoryCache.set(courseId, newMessages);
              cacheTimestamps.set(courseId, Date.now());
            }
            return newMessages;
          });
        } catch (error) {
          console.error("Error parsing new message:", error);
          // Fallback to refetching if parsing fails
          if (courseId) {
            fetchChatHistory(courseId);
          }
        }
      } else if (data.startsWith("MESSAGE_UPDATED:")) {
        // Handle message edits
        try {
          const messageJson = data.replace("MESSAGE_UPDATED:", "");
          const updatedMessage: ChatMessage = JSON.parse(messageJson);

          setMessages((prev) => {
            const newMessages = prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            );
            // Update cache
            if (courseId) {
              chatHistoryCache.set(courseId, newMessages);
              cacheTimestamps.set(courseId, Date.now());
            }
            return newMessages;
          });
        } catch (error) {
          console.error("Error parsing updated message:", error);
        }
      } else if (data.startsWith("MESSAGE_DELETED:")) {
        // Handle message deletes
        try {
          const messageId = parseInt(data.replace("MESSAGE_DELETED:", ""));

          setMessages((prev) => {
            const newMessages = prev.filter((msg) => msg.id !== messageId);
            // Update cache
            if (courseId) {
              chatHistoryCache.set(courseId, newMessages);
              cacheTimestamps.set(courseId, Date.now());
            }
            return newMessages;
          });
        } catch (error) {
          console.error("Error parsing deleted message ID:", error);
        }
      } else if (data.startsWith("MESSAGE:")) {
        // Fallback for old format messages - parse manually
        const message = data.replace("MESSAGE:", "");
        const parts = message.split(": ", 2);
        if (parts.length === 2) {
          const [displayName, content] = parts;
          const fallbackMessage: ChatMessage = {
            id: Date.now(), // Temporary ID
            senderId: "unknown",
            displayName: displayName,
            content: content,
            isAnonymous: false,
            timestamp: new Date().toISOString(),
            courseId: courseId || 0,
            isDeleted: false,
          };

          setMessages((prev) => {
            const newMessages = [...prev, fallbackMessage];
            if (courseId) {
              chatHistoryCache.set(courseId, newMessages);
              cacheTimestamps.set(courseId, Date.now());
            }
            return newMessages;
          });
        }
      } else {
        // Unknown message format - log and ignore
        console.warn("Unknown WebSocket message format:", data);
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
  }, [url, courseId, isAnonymous, fetchChatHistory]);

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

  const editMessage = useCallback(
    async (messageId: number, newContent: string) => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Chat/${messageId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: newContent }),
          }
        );

        if (response.ok) {
          // Don't update local state - WebSocket will handle the real-time update
          return { success: true };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.message || "Failed to edit message",
          };
        }
      } catch (error) {
        console.error("Error editing message:", error);
        return { success: false, error: "Network error" };
      }
    },
    []
  );

  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Chat/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Don't update local state - WebSocket will handle the real-time update
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Failed to delete message",
        };
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      return { success: false, error: "Network error" };
    }
  }, []);

  return {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    isLoading,
    connectedUsers,
  };
}
