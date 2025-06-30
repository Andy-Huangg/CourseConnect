import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Stack,
  Paper,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { signup } from "./authSlice";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(signup({ username, password }));
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5">Sign Up</Typography>
        </Box>

        <Box component="form" onSubmit={handleSignup}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {isAuthenticated && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Signup successful! Redirecting...
            </Alert>
          )}

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
            <Link component={RouterLink} to="/" variant="body2">
              ← Back to Home
            </Link>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Login
            </Link>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
