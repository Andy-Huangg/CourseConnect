import { useState, useRef, useEffect } from "react";
import { useChatSocket } from "../hooks/useChatSocket";

interface Course {
  id: number;
  name: string;
}

interface ChatProps {
  wsBase: string;
}

export default function Chat({ wsBase }: ChatProps) {
  const [input, setInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState("");
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const wsUrl = selectedCourse ? `${wsBase}?courseId=${selectedCourse}` : null;
  const { messages, sendMessage, isLoading, connectedUsers } = useChatSocket(
    wsUrl,
    selectedCourse
  );

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Course`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const coursesData: Course[] = await response.json();
          setCourses(coursesData);

          // Set default course if none selected
          if (!selectedCourse && coursesData.length > 0) {
            setSelectedCourse(coursesData[0].id);
          }
        } else {
          console.error("Failed to fetch courses:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [selectedCourse]);

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

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;

    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Course`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newCourseName.trim() }),
        }
      );

      if (response.ok) {
        const newCourse: Course = await response.json();
        setCourses((prev) => [...prev, newCourse]);
        setSelectedCourse(newCourse.id);
        setNewCourseName("");
        setShowCreateCourse(false);
      } else {
        console.error("Failed to create course:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating course:", error);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h2 style={{ margin: 0 }}>Chat</h2>
        <div
          style={{
            backgroundColor: "#e3f2fd",
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "14px",
            color: "#1976d2",
            fontWeight: "500",
          }}
        >
          {connectedUsers} {connectedUsers === 1 ? "user" : "users"} online
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <label>
          Select Course:{" "}
          <select
            value={selectedCourse || ""}
            onChange={(e) => handleCourseChange(Number(e.target.value))}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => setShowCreateCourse(!showCreateCourse)}
          style={{
            padding: "5px 10px",
            backgroundColor: "#007acc",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showCreateCourse ? "Cancel" : "Create Course"}
        </button>
      </div>

      {showCreateCourse && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCourse()}
            style={{
              flex: 1,
              padding: "5px",
              border: "1px solid #ccc",
              borderRadius: "3px",
            }}
            placeholder="Enter course name (e.g., CS150, Web Dev)..."
          />
          <button
            onClick={handleCreateCourse}
            style={{
              padding: "5px 10px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Create
          </button>
        </div>
      )}
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
