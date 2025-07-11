import React, { useState, useEffect } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeContext, type ThemeMode } from "./ThemeContext";

// Discord-inspired theme colors with Rebecca Purple accent
const appColors = {
  light: {
    primary: "#663399", // Rebecca Purple
    secondary: "#4E5D94",
    background: "#f5f5f5",
    paper: "#ffffff",
    sidebar: "#f2f3f5",
    divider: "#e3e5e8",
    hover: "#e9e9e9",
    cardBackground: "#ffffff",
    inputBackground: "#ebedef",
    messageHover: "#f7f7f8",
    chatBackground: "#ffffff",
  },
  dark: {
    primary: "#9966CC", // Lighter Rebecca Purple for dark mode
    secondary: "#B9BBBE",
    background: "#2f3136", // Discord dark background
    paper: "#36393f", // Discord dark surface
    sidebar: "#202225", // Discord dark sidebar
    divider: "#40444b",
    hover: "#3c3f45",
    cardBackground: "#2b2d31",
    inputBackground: "#40444b",
    messageHover: "#32353b",
    chatBackground: "#36393f",
  },
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme-mode") as ThemeMode;
    // Check system preference if no saved theme
    if (!savedTheme) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return savedTheme;
  });

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme-mode", newMode);
  };

  const baseTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: appColors[mode].primary,
        contrastText: "#ffffff",
      },
      secondary: {
        main: appColors[mode].secondary,
      },
      background: {
        default: appColors[mode].background,
        paper: appColors[mode].paper,
      },
      divider: appColors[mode].divider,
      text: {
        primary: mode === "light" ? "#2e3338" : "#dcddde",
        secondary: mode === "light" ? "#747f8d" : "#a3a6aa",
      },
      action: {
        hover: appColors[mode].hover,
      },
    },
    typography: {
      fontFamily:
        '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontSize: "0.9375rem", lineHeight: 1.4 },
      body2: { fontSize: "0.875rem", lineHeight: 1.4 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            padding: "8px 16px",
            transition: "all 0.2s",
          },
          contained: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              filter: "brightness(0.9)",
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: appColors[mode].inputBackground,
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: appColors[mode].primary,
              },
            },
          },
        },
      },
    },
  });

  // Apply responsive font sizes
  const theme = responsiveFontSizes(baseTheme);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem("theme-mode")) {
        setMode(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
