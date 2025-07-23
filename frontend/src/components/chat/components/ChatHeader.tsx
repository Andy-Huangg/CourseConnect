import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import TagIcon from "@mui/icons-material/Tag";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import type { ChatHeaderProps } from "../types";

const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  minHeight: 64,
  maxHeight: 64,
  flexShrink: 0,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 1px 0 rgba(4, 4, 5, 0.2)"
      : "0 1px 0 rgba(0, 0, 0, 0.06)",
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1, 1.5),
    minHeight: 56,
    maxHeight: 56,
  },
}));

export default function ChatHeader({
  buddy,
  currentCourse,
  connectionState,
  messagesCount,
  connectedUsers,
}: ChatHeaderProps) {
  return (
    <Header>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, md: 2 },
          flex: 1,
          minWidth: 0,
        }}
      >
        <TagIcon sx={{ color: "text.secondary", flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                fontSize: { xs: "1rem", md: "1.25rem" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {buddy
                ? `${buddy.displayName}`
                : currentCourse?.name || "Select a Course"}
            </Typography>
            {!buddy && (
              <FiberManualRecordIcon
                sx={{
                  fontSize: 8,
                  flexShrink: 0,
                  color:
                    connectionState === "connected" ? "#4caf50" : "#ff9800",
                }}
              />
            )}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: { xs: "0.7rem", md: "0.75rem" },
            }}
          >
            {buddy
              ? "Private Messages"
              : `${messagesCount} messages • ${connectedUsers} ${
                  connectedUsers === 1 ? "user" : "users"
                } online`}
            {!buddy && connectionState !== "connected" && (
              <>
                {" "}
                •{" "}
                <span
                  style={{
                    color: "#ff9800",
                  }}
                >
                  Connecting...
                </span>
              </>
            )}
          </Typography>
        </Box>
      </Box>
    </Header>
  );
}
