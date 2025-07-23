import { Box, Typography, Avatar, IconButton, Tooltip } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { MessageItemProps } from "../types";

const MessageGroup = styled(Box)(({ theme }) => ({
  margin: theme.spacing(0.25, 2),
  padding: theme.spacing(1, 2),
  backgroundColor: "transparent",
  border: "none",
  boxShadow: "none",
  borderRadius: 0,
  transition: "background-color 0.1s ease",
  "&:hover": {
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(4, 4, 5, 0.07)"
        : "rgba(6, 6, 7, 0.02)",
    "& .message-actions": {
      opacity: 1,
    },
  },
  borderLeft: "4px solid transparent",
  "&.own-message": {
    borderLeftColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === "dark"
        ? "rgba(153, 102, 204, 0.05)"
        : "rgba(102, 51, 153, 0.05)",
  },
  [theme.breakpoints.down("md")]: {
    margin: theme.spacing(0.125, 1),
    padding: theme.spacing(0.75, 1.5),
  },
}));

export default function MessageItem({
  message,
  isOwnMessage,
  onEditMessage,
  onDeleteMessage,
}: MessageItemProps) {
  const theme = useTheme();

  // Handle different message types properly
  const displayName =
    "displayName" in message ? message.displayName : message.senderName;

  const handleEditClick = () => {
    onEditMessage(message.id, message.content);
  };

  const handleDeleteClick = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      await onDeleteMessage(message.id);
    }
  };

  return (
    <MessageGroup
      className={isOwnMessage ? "own-message" : ""}
      sx={{
        backgroundColor: isOwnMessage
          ? theme.palette.mode === "dark"
            ? "rgba(102, 51, 153, 0.05)"
            : "rgba(102, 51, 153, 0.03)"
          : "transparent",
        borderLeft: isOwnMessage
          ? `3px solid ${theme.palette.primary.main}`
          : "none",
        ml: isOwnMessage ? { xs: 0.5, md: 1.5 } : { xs: 1, md: 2 },
        "&:hover": {
          backgroundColor: isOwnMessage
            ? theme.palette.mode === "dark"
              ? "rgba(102, 51, 153, 0.08)"
              : "rgba(102, 51, 153, 0.05)"
            : theme.palette.mode === "dark"
            ? "rgba(4, 4, 5, 0.07)"
            : "rgba(6, 6, 7, 0.02)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: { xs: 0.75, md: 1.5 },
        }}
      >
        <Avatar
          sx={{
            width: { xs: 32, md: 40 },
            height: { xs: 32, md: 40 },
            backgroundColor: isOwnMessage
              ? theme.palette.primary.main
              : theme.palette.secondary.main,
            fontSize: { xs: "0.75rem", md: "0.875rem" },
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {displayName?.charAt(0).toUpperCase() || "?"}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 1,
              mb: 0.125,
              minHeight: "auto",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: isOwnMessage
                  ? theme.palette.primary.main
                  : "text.primary",
                fontSize: { xs: "0.8rem", md: "0.875rem" },
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.65rem", md: "0.75rem" },
                lineHeight: 1.2,
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
            {"editedAt" in message && message.editedAt && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontStyle: "italic",
                  fontSize: { xs: "0.65rem", md: "0.75rem" },
                  lineHeight: 1.2,
                }}
              >
                (edited)
              </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            {isOwnMessage && (
              <Box
                className="message-actions"
                sx={{
                  display: "flex",
                  gap: 0.25,
                  flexShrink: 0,
                  alignItems: "center",
                  opacity: { xs: 1, md: 0 }, // Always visible on mobile
                  transition: "opacity 0.2s ease",
                }}
              >
                <Tooltip title="Edit message">
                  <IconButton
                    size="small"
                    onClick={handleEditClick}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                      width: 18,
                      height: 18,
                      p: 0,
                      minWidth: "unset",
                      minHeight: "unset",
                    }}
                  >
                    <EditIcon
                      sx={{
                        fontSize: "0.7rem",
                      }}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete message">
                  <IconButton
                    size="small"
                    onClick={handleDeleteClick}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "error.main" },
                      width: 18,
                      height: 18,
                      p: 0,
                      minWidth: "unset",
                      minHeight: "unset",
                    }}
                  >
                    <DeleteIcon
                      sx={{
                        fontSize: "0.7rem",
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          <Typography
            variant="body1"
            sx={{
              wordBreak: "break-word",
              fontSize: { xs: "0.875rem", md: "1rem" },
              lineHeight: 1.4,
              mt: 0,
            }}
          >
            {message.content}
          </Typography>
        </Box>
      </Box>
    </MessageGroup>
  );
}
