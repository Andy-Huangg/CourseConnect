// Signup.tsx
import { useState } from "react";
import { TextField, Button, Box, Typography, Alert } from "@mui/material";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setIsError(false);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();
      console.log(data);

      if (res.ok && data.token) {
        localStorage.setItem("jwt", data.token);
        setMsg("Signup successful!");
      } else {
        setIsError(true);
        // Check if the error is specifically about username already existing
        if (data.message === "Username already exists.") {
          setMsg("Username already exists.");
        } else {
          // For other errors
          setMsg(typeof data.message === "string" ? data : "Signup failed");
        }
      }
    } catch (error) {
      setIsError(true);
      setMsg("An error occurred during signup");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSignup}
      sx={{ maxWidth: 400, mx: "auto", mt: 4 }}
    >
      <Typography variant="h5" mb={2}>
        Sign Up
      </Typography>
      <TextField
        label="Username"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Sign Up
      </Button>
      {msg && (
        <Alert severity={isError ? "error" : "success"} sx={{ mt: 2 }}>
          {msg}
        </Alert>
      )}
    </Box>
  );
}
