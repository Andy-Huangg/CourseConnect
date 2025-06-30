import { IconButton, Tooltip } from "@mui/material";
import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
      <IconButton
        onClick={toggleTheme}
        color="inherit"
        sx={{ fontSize: "1.2rem" }}
      >
        {mode === "light" ? "🌙" : "☀️"}
      </IconButton>
    </Tooltip>
  );
}
