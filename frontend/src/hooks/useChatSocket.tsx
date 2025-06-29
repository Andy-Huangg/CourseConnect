import { useEffect, useRef, useState } from "react";

export function useChatSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("jwt");

    // Ensure URL has token parameter
    const urlWithToken = url.includes("token=")
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}token=${token}`;

    socketRef.current = new WebSocket(urlWithToken);

    socketRef.current.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    return () => socketRef.current?.close();
  }, [url]);

  const sendMessage = (message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    }
  };

  return { messages, sendMessage };
}
