import { useState, useRef, useEffect, useMemo } from "react";
import { Typography, Switch, FormControlLabel, Chip } from "@mui/material";
import { useChatSocket } from "../hooks/useChatSocket";
import { useCourses } from "../hooks/useCourses";

interface ChatProps {
  wsBase: string;
}

export default function Chat({ wsBase }: ChatProps) {
  const [input, setInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [anonymousName, setAnonymousName] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use the shared course context instead of fetching again
  const { enrolledCourses, isLoading: coursesLoading } = useCourses();

  // Memoize the courses to prevent unnecessary re-renders
  const courses = useMemo(() => enrolledCourses, [enrolledCourses]);

  // Only connect to WebSocket after preferences are loaded
  const wsUrl =
    selectedCourse && preferencesLoaded
      ? `${wsBase}?courseId=${selectedCourse}`
      : null;
  const { messages, sendMessage, isLoading, connectedUsers } = useChatSocket(
    wsUrl,
    selectedCourse,
    isAnonymous
  );

  // Fetch anonymous name for the current course
  const fetchAnonymousName = async (courseId: number) => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Chat/anonymous-name/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnonymousName(data.anonymousName);
      } else {
        console.error("Failed to fetch anonymous name:", response.statusText);
        setAnonymousName("");
      }
    } catch (error) {
      console.error("Error fetching anonymous name:", error);
      setAnonymousName("");
    }
  };

  // Load anonymous mode preference for the selected course
  useEffect(() => {
    if (selectedCourse) {
      // Load preferences immediately when course changes
      const savedAnonymousMode = localStorage.getItem(
        `anonymousMode_${selectedCourse}`
      );
      const newAnonymousMode = savedAnonymousMode === "true";

      // Set both the anonymous mode and preferences loaded state together
      setIsAnonymous(newAnonymousMode);
      setPreferencesLoaded(true);

      // Fetch anonymous name for this course
      fetchAnonymousName(selectedCourse);
    } else {
      setPreferencesLoaded(false);
      setAnonymousName("");
    }
  }, [selectedCourse]);

  // Save anonymous mode preference when it changes
  const handleAnonymousModeChange = (checked: boolean) => {
    setIsAnonymous(checked);
    if (selectedCourse) {
      localStorage.setItem(
        `anonymousMode_${selectedCourse}`,
        checked.toString()
      );
    }
  };

  // Set default course when courses load (only once)
  useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      const defaultCourse = courses[0].id;
      setSelectedCourse(defaultCourse);
      // Note: Anonymous mode preference will be loaded by the effect above
    }
  }, [selectedCourse, courses]);

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
    // Don't reset preferencesLoaded here - let the effect handle preference loading
  };

  // Show loading state while courses are being fetched or preferences are loading
  if (coursesLoading || !preferencesLoaded) {
    return (
      <div
        style={{ maxWidth: "600px", margin: "20px auto", textAlign: "center" }}
      >
        <Typography>
          {coursesLoading
            ? "Loading courses..."
            : "Loading chat preferences..."}
        </Typography>
      </div>
    );
  }

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

      {courses.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            margin: "20px 0",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Enrolled Courses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't enrolled in any courses yet. Go to the "My Courses" tab
            to select courses and join the conversation!
          </Typography>
        </div>
      ) : (
        <>
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
                    {course.id === 1 ? " (Global Chat)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              padding: "8px",
              backgroundColor: isAnonymous ? "#fff3e0" : "#f8f9fa",
              borderRadius: "6px",
              border: `1px solid ${isAnonymous ? "#ffcc02" : "#e0e0e0"}`,
              transition: "all 0.2s ease",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isAnonymous}
                  onChange={(e) => handleAnonymousModeChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <span style={{ fontWeight: 500 }}>
                  Anonymous Mode
                  <Typography
                    variant="caption"
                    component="div"
                    style={{
                      color: "#666",
                      marginTop: "2px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {isAnonymous && anonymousName
                      ? `You appear as: ${anonymousName}`
                      : "Get a unique anonymous name for this course"}
                  </Typography>
                </span>
              }
              style={{ margin: 0, flex: 1 }}
            />
            {isAnonymous && (
              <Chip
                label={anonymousName ? `🎭 ${anonymousName}` : "🎭 Anonymous"}
                color="warning"
                size="small"
                variant="filled"
                style={{
                  backgroundColor: "#ff9800",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            )}
          </div>
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
        </>
      )}
    </div>
  );
}
