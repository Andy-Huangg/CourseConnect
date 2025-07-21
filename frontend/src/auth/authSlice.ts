import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Define types
interface AuthState {
  user: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginPayload {
  username: string;
  password: string;
}

// Helper function to check if token is valid and not expired
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp && payload.exp > currentTime;
  } catch {
    return false;
  }
};

// Helper function to get user from token
const getUserFromToken = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.displayName || payload.sub || null;
  } catch {
    return null;
  }
};

// Initial state
// Better initial state with proper token validation
const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem("jwt");

  if (token && isTokenValid(token)) {
    const user = getUserFromToken(token);
    return {
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
  }

  // Remove invalid/expired token
  if (token) {
    localStorage.removeItem("jwt");
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialAuthState();

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Login failed");
      }

      // Save token to localStorage
      localStorage.setItem("jwt", data.token);
      return { token: data.token, user: credentials.username };
    } catch {
      return rejectWithValue("An error occurred during login");
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }
      );

      // Try to get the response as text first
      const responseText = await response.text();

      // Then parse it as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // If not JSON, use the text as is
        data = { message: responseText };
      }

      if (!response.ok) {
        // Handle different error formats
        const errorMessage = data.message || responseText || "Signup failed";
        return rejectWithValue(
          errorMessage === "Username already exists."
            ? "Username already exists."
            : errorMessage
        );
      }

      // Save token to localStorage
      localStorage.setItem("jwt", data.token);
      return { token: data.token, user: credentials.username };
    } catch {
      return rejectWithValue("An error occurred during signup");
    }
  }
);

export const updateDisplayName = createAsyncThunk(
  "auth/updateDisplayName",
  async (displayName: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        return rejectWithValue("No authentication token found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/User/profile/display-name`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ displayName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to update display name");
      }

      // Update token in localStorage if a new one is provided
      if (data.token) {
        localStorage.setItem("jwt", data.token);
      }

      return {
        displayName: data.displayName,
        token: data.token || token,
      };
    } catch {
      return rejectWithValue("An error occurred while updating display name");
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("jwt");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add action to check token validity
    checkAuth: (state) => {
      const token = localStorage.getItem("jwt");
      if (token && isTokenValid(token)) {
        state.token = token;
        state.user = getUserFromToken(token);
        state.isAuthenticated = true;
      } else {
        localStorage.removeItem("jwt");
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Signup cases
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update display name cases
      .addCase(updateDisplayName.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDisplayName.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = getUserFromToken(action.payload.token);
        state.error = null;
      })
      .addCase(updateDisplayName.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, checkAuth } = authSlice.actions;
export default authSlice.reducer;
