import { Box, Typography, Button, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../auth/authSlice";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleSignOut = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 8, p: 3 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4">Welcome to the Dashboard</Typography>
          <ThemeToggle />
        </Box>

        <Typography variant="body1" sx={{ mb: 4 }}>
          You are logged in as <strong>{user}</strong>
        </Typography>

        <Button variant="contained" color="primary" onClick={handleSignOut}>
          Sign Out
        </Button>
      </Paper>
    </Box>
  );
}
