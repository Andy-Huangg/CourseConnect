import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Paper,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { signup, clearError } from "./authSlice";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    username: "",
    password: "",
  });

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  // Clear any existing error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Validation functions
  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return "Username must be at least 3 characters long";
    }
    return "";
  };

  const validatePassword = (value: string) => {
    if (value.length < 4) {
      return "Password must be at least 4 characters long";
    }
    return "";
  };

  // Handle input changes with validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setValidationErrors(prev => ({
      ...prev,
      username: validateUsername(value)
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setValidationErrors(prev => ({
      ...prev,
      password: validatePassword(value)
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both fields before submission
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    
    setValidationErrors({
      username: usernameError,
      password: passwordError,
    });
    
    // Only proceed if no validation errors
    if (!usernameError && !passwordError) {
      dispatch(signup({ username, password }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          width: "100%",
          maxWidth: 420,
          boxShadow: 3,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "primary.main" }}
          >
            CourseConnect
          </Typography>
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
            Sign Up
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Create your account to connect with course mates
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSignup}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={handleUsernameChange}
            autoComplete="username"
            variant="outlined"
            error={!!validationErrors.username}
            helperText={validationErrors.username || "Minimum 3 characters"}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            variant="outlined"
            error={!!validationErrors.password}
            helperText={validationErrors.password || "Minimum 4 characters"}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={
              isLoading || 
              !!validationErrors.username || 
              !!validationErrors.password ||
              username.length < 3 ||
              password.length < 4
            }
            sx={{
              py: 1.5,
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: 2,
              textTransform: "none",
              boxShadow: 2,
              "&:hover": { boxShadow: 4 },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Account"
            )}
          </Button>
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {isAuthenticated && (
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              Signup successful! Redirecting...
            </Alert>
          )}

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Sign in here
              </Link>
            </Typography>
            <Link
              component={RouterLink}
              to="/"
              variant="body2"
              sx={{
                color: "text.secondary",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                "&:hover": {
                  color: "primary.main",
                  textDecoration: "underline",
                },
              }}
            >
              ← Back to Home
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
