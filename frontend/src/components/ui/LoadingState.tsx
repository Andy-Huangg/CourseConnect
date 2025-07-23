import { Box, Typography, CircularProgress } from "@mui/material";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        color: "text.secondary",
        p: 4,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
}
