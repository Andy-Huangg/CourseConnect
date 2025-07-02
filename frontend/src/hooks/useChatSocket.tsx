import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  courseId: number;
}

export function useChatSocket(url: string, courseId: number) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);

  // Function to fetch chat history from API
  const fetchChatHistory = async (courseId: number) => {
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
        // Convert chat messages to display format
        const messageTexts = chatHistory.map(
          (msg) => `${msg.senderId}: ${msg.content}`
        );
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
  };

  useEffect(() => {
    // Clear messages when course changes
    setMessages([]);
    setConnectedUsers(0);

    // Fetch previous messages for the new course
    fetchChatHistory(courseId);

    // Get token from localStorage
    const token = localStorage.getItem("jwt");

    // Ensure URL has token parameter
    const urlWithToken = url.includes("token=")
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}token=${token}`;

    socketRef.current = new WebSocket(urlWithToken);

    socketRef.current.onmessage = (event) => {
      const data = event.data;

      if (data.startsWith("USER_COUNT:")) {
        const count = parseInt(data.replace("USER_COUNT:", ""));
        setConnectedUsers(count);
      } else if (data.startsWith("MESSAGE:")) {
        const message = data.replace("MESSAGE:", "");
        setMessages((prev) => [...prev, message]);
      } else {
        // Fallback for old format messages
        setMessages((prev) => [...prev, data]);
      }
    };

    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
    };
  }, [url, courseId]);

  const sendMessage = (message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && message.trim()) {
      socketRef.current.send(message.trim());
    }
  };

  return { messages, sendMessage, isLoading, connectedUsers };
}
