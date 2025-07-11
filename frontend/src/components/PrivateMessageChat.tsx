import { useState, useRef, useEffect } from "react";
import { usePrivateMessages } from "../hooks/usePrivateMessages";
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

interface PrivateMessageChatProps {
  recipientId: number;
  recipientName: string;
}

export default function PrivateMessageChat({
  recipientId,
  recipientName,
}: PrivateMessageChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const [editingMessage, setEditingMessage] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    unreadCounts,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
  } = usePrivateMessages(recipientId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.senderId === recipientId
    );
    unreadMessages.forEach((msg) => markAsRead(msg.id));
  }, [messages, recipientId, markAsRead]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const result = await sendMessage(recipientId, messageInput.trim());
    if (result.success) {
      setMessageInput("");
    } else {
      alert(result.error || "Failed to send message");
    }
  };

  const handleEditMessage = (messageId: number, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;

    const result = await editMessage(editingMessage.id, editingMessage.content);
    if (result.success) {
      setIsEditDialogOpen(false);
      setEditingMessage(null);
    } else {
      alert(result.error || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    const result = await deleteMessage(messageId);
    if (!result.success) {
      alert(result.error || "Failed to delete message");
    }
  };

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return parseInt(payload.userId); // Use the userId claim which contains the actual numeric user ID
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Typography variant="h6">
          Chat with {recipientName}
          {unreadCounts.unreadByUser[recipientId] > 0 && (
            <Typography
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.5,
                backgroundColor: "#ff4444",
                color: "white",
                borderRadius: "12px",
                fontSize: "0.75rem",
              }}
            >
              {unreadCounts.unreadByUser[recipientId]} unread
            </Typography>
          )}
        </Typography>
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1,
          backgroundColor: "#fafafa",
        }}
      >
        {isLoading && (
          <Typography sx={{ textAlign: "center", color: "#666", p: 2 }}>
            Loading messages...
          </Typography>
        )}

        {error && (
          <Typography sx={{ textAlign: "center", color: "#f44336", p: 2 }}>
            {error}
          </Typography>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <Typography sx={{ textAlign: "center", color: "#666", p: 2 }}>
            No messages yet. Start the conversation!
          </Typography>
        )}

        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === currentUserId;
          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                mb: 1,
              }}
            >
              <Paper
                sx={{
                  maxWidth: "70%",
                  p: 1.5,
                  backgroundColor: isOwnMessage ? "#007acc" : "#fff",
                  color: isOwnMessage ? "white" : "black",
                  position: "relative",
                  "&:hover .message-actions": {
                    opacity: 1,
                  },
                }}
              >
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {msg.content}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.7,
                      fontSize: "0.7rem",
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                    {msg.editedAt && " (edited)"}
                    {isOwnMessage && (msg.isRead ? " ✓✓" : " ✓")}
                  </Typography>

                  {isOwnMessage && (
                    <Box
                      className="message-actions"
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.2s",
                        ml: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleEditMessage(msg.id, msg.content)}
                        sx={{ color: "inherit", p: 0.5 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMessage(msg.id)}
                        sx={{ color: "inherit", p: 0.5 }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            sx={{ minWidth: "80px" }}
          >
            Send
          </Button>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            rows={3}
            value={editingMessage?.content || ""}
            onChange={(e) =>
              setEditingMessage((prev) =>
                prev ? { ...prev, content: e.target.value } : null
              )
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
