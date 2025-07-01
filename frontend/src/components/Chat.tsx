import { useState, useRef, useEffect } from "react";
import { useChatSocket } from "../hooks/useChatSocket";

const COURSES = [
  { id: 1, name: "Global" },
  { id: 2, name: "Test1" },
  { id: 3, name: "Test2" },
];

interface ChatProps {
  wsBase: string;
}

export default function Chat({ wsBase }: ChatProps) {
  const [input, setInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0].id);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const wsUrl = `${wsBase}?courseId=${selectedCourse}`;
  const { messages, sendMessage, isLoading } = useChatSocket(
    wsUrl,
    selectedCourse
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleCourseChange = (courseId: number) => {
    setSelectedCourse(courseId);
    setInput("");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <h2>Chat</h2>
      <label style={{ display: "block", marginBottom: "10px" }}>
        Select Course:{" "}
        <select
          value={selectedCourse}
          onChange={(e) => handleCourseChange(Number(e.target.value))}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          {COURSES.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </label>
      <div
        ref={chatContainerRef}
        style={{
          border: "1px solid #ccc",
          height: 300,
          overflowY: "auto",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          borderRadius: "5px",
        }}
      >
        {isLoading ? (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            Loading chat history...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "8px",
                padding: "5px",
                backgroundColor: "white",
                borderRadius: "3px",
                borderLeft: "3px solid #007acc",
              }}
            >
              {msg}
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "3px",
          }}
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007acc",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
