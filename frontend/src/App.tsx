import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useChatSocket } from "./hooks/useChatSocket";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

const COURSES = [
  { id: 1, name: "Global" },
  { id: 2, name: "Test1" },
  { id: 3, name: "Test2" },
];

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");
  const [input, setInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0].id);
  // Build the WebSocket URL with the selected courseId as a query param
  const wsBase = import.meta.env.VITE_WS_URL;
  const wsUrl = `${wsBase}?courseId=${selectedCourse}`;

  const { messages, sendMessage } = useChatSocket(wsUrl);

  useEffect(() => {
    // Fetch data from the backend
    fetch(`${import.meta.env.VITE_API_URL}/`)
      .then((response) => response.text())
      .then((data) => setMessage(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <Link to="/login">Go to Login</Link>

      <div>
        <h2>Chat</h2>
        <label>
          Select Course:{" "}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(Number(e.target.value))}
          >
            {COURSES.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <div
          style={{ border: "1px solid #ccc", height: 200, overflowY: "auto" }}
        >
          {messages.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
      <h1>Message: {message}</h1>
    </>
  );
}

export default App;
