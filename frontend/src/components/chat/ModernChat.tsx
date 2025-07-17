import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import TagIcon from "@mui/icons-material/Tag";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useCourses } from "../../hooks/useCourses";
import { useChatSocket } from "../../hooks/useChatSocket";
import { usePrivateMessages } from "../../hooks/usePrivateMessages";
import { useNewMessageIndicatorsContext } from "../../hooks/useNewMessageIndicatorsContext";

// Styled components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  backgroundColor:
    theme.palette.mode === "dark"
      ? "#36393f" // dark chat background
      : "#ffffff",
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  minHeight: 64,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 1px 0 rgba(4, 4, 5, 0.2)"
      : "0 1px 0 rgba(0, 0, 0, 0.06)",
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(1, 0),
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.palette.mode === "dark" ? "#202225" : "#ddd",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: theme.palette.mode === "dark" ? "#36393f" : "#bbb",
  },
}));

const MessageGroup = styled(Paper)(({ theme }) => ({
  margin: theme.spacing(0.5, 2),
  padding: theme.spacing(1.5, 2),
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
}));

const MessageInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

interface ModernChatProps {
  wsBase: string;
  selectedCourse?: number;
  buddy?: { id: number; username: string; displayName: string };
  markCourseMessageAsRead?: (messageId: number) => Promise<void>;
}

export default function ModernChat({
  wsBase,
  selectedCourse: propSelectedCourse,
  buddy,
  markCourseMessageAsRead,
}: ModernChatProps) {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(
    propSelectedCourse || null
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [anonymousName, setAnonymousName] = useState<string>("");
  const [editingMessage, setEditingMessage] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId; // Use the userId claim which contains the actual numeric user ID
    } catch {
      return null;
    }
  };

  // Memoize expensive operations
  const currentUserId = useMemo(() => getCurrentUserId(), []); // Memoize user ID calculation

  const { enrolledCourses, isLoading: coursesLoading } = useCourses();

  // Memoize the courses to prevent unnecessary re-renders
  const courses = useMemo(() => enrolledCourses, [enrolledCourses]);

  // Memoize current course lookup
  const currentCourse = useMemo(() => 
    enrolledCourses.find(course => course.id === selectedCourse),
    [enrolledCourses, selectedCourse]
  );

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedCourse && propSelectedCourse !== selectedCourse) {
      setSelectedCourse(propSelectedCourse);
    }
  }, [propSelectedCourse, selectedCourse]);

  // Only connect to WebSocket after preferences are loaded
  const wsUrl = buddy
    ? null // For private messages, we'll use usePrivateMessages hook instead
    : selectedCourse && preferencesLoaded
    ? `${wsBase}?courseId=${selectedCourse}` // For course chat
    : null;

  // Use different hooks for course chat vs private messages
  const {
    messages: courseMessages,
    sendMessage: sendCourseMessage,
    editMessage: editCourseMessage,
    deleteMessage: deleteCourseMessage,
    isLoading: courseLoading,
    connectedUsers,
  } = useChatSocket(wsUrl, buddy ? null : selectedCourse, isAnonymous);

  const {
    messages: privateMessages,
    sendMessage: sendPrivateMessage,
    editMessage: editPrivateMessage,
    deleteMessage: deletePrivateMessage,
    isLoading: privateLoading,
    markAsRead: markPrivateMessageAsRead,
  } = usePrivateMessages(buddy?.id);

  // Get the new message indicators context
  const { handleCourseMessageUpdate } = useNewMessageIndicatorsContext();

  // Track previous message count to detect new messages
  const previousMessageCountRef = useRef(0);

  // Effect to detect new course messages and update indicators - Optimized
  useEffect(() => {
    if (!buddy && selectedCourse && courseMessages.length > 0) {
      const currentMessageCount = courseMessages.length;
      const previousCount = previousMessageCountRef.current;

      // If we have more messages than before, a new message was received
      if (currentMessageCount > previousCount && previousCount > 0) {
        const newMessage = courseMessages[courseMessages.length - 1];
        // Call the indicator update function
        handleCourseMessageUpdate(selectedCourse, newMessage.senderId);
      }

      previousMessageCountRef.current = currentMessageCount;
    }
  }, [courseMessages.length, buddy, selectedCourse, handleCourseMessageUpdate]);

  // Use the appropriate data based on whether we're in buddy chat or course chat
  const messages = buddy ? privateMessages : courseMessages;
  const isLoading = buddy ? privateLoading : courseLoading;
  const sendMessage = buddy
    ? (content: string) => sendPrivateMessage(buddy.id, content)
    : sendCourseMessage;
  const editMessage = buddy ? editPrivateMessage : editCourseMessage;
  const deleteMessage = buddy ? deletePrivateMessage : deleteCourseMessage;

  // Fetch anonymous name for the current course
  const fetchAnonymousName = async (courseId: number) => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Chat/anonymous-name/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnonymousName(data.anonymousName);
      } else {
        setAnonymousName("");
      }
    } catch (error) {
      setAnonymousName("");
    }
  };

  // Load anonymous mode preference for the selected course
  useEffect(() => {
    if (selectedCourse) {
      const savedAnonymousMode = localStorage.getItem(
        `anonymousMode_${selectedCourse}`
      );
      const newAnonymousMode = savedAnonymousMode === "true";

      setIsAnonymous(newAnonymousMode);
      setPreferencesLoaded(true);
      fetchAnonymousName(selectedCourse);
    } else {
      setPreferencesLoaded(false);
      setAnonymousName("");
    }
  }, [selectedCourse]);

  // Save anonymous mode preference when it changes
  const handleAnonymousModeChange = (checked: boolean) => {
    setIsAnonymous(checked);
    if (selectedCourse) {
      localStorage.setItem(
        `anonymousMode_${selectedCourse}`,
        checked.toString()
      );
    }
  };

  // Set default course when courses load (only once)
  useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      const defaultCourse = courses[0].id;
      setSelectedCourse(defaultCourse);
    }
  }, [selectedCourse, courses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); // Changed from "smooth" to "auto" for better performance
  };

  // Optimized: Only scroll when new message is actually added, not on every render
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]); // Changed dependency to messages.length instead of messages array

  // Mark messages as read when they're displayed (optimized with useMemo)
  const unreadMessageIds = useMemo(() => {
    if (messages.length === 0 || !currentUserId) return [];
    
    if (buddy) {
      return messages
        .filter(msg => 
          msg.senderId !== currentUserId.toString() &&
          "isRead" in msg &&
          !msg.isRead
        )
        .slice(-3) // Only last 3 unread messages
        .map(msg => msg.id);
    } else {
      return messages
        .filter(msg => msg.senderId !== currentUserId.toString())
        .slice(-5) // Only last 5 unread messages  
        .map(msg => msg.id);
    }
  }, [messages.length, currentUserId, buddy]); // Only recalculate when message count changes

  useEffect(() => {
    if (unreadMessageIds.length === 0) return;

    const markMessagesAsReadDebounced = async () => {
      if (buddy && markPrivateMessageAsRead) {
        // Mark private messages as read
        for (const msgId of unreadMessageIds) {
          try {
            await markPrivateMessageAsRead(msgId);
          } catch (error) {
          }
        }
      } else if (markCourseMessageAsRead && selectedCourse) {
        // Mark course messages as read
        unreadMessageIds.forEach((msgId) => {
          markCourseMessageAsRead(msgId).catch((error) => {
          });
        });
      }
    };

    // Debounce the marking to avoid excessive calls
    const timeoutId = setTimeout(markMessagesAsReadDebounced, 3000); // Increased to 3 seconds

    return () => clearTimeout(timeoutId);
  }, [
    unreadMessageIds.length, // Only trigger when the count of unread messages changes
    buddy,
    markPrivateMessageAsRead,
    markCourseMessageAsRead,
    selectedCourse,
  ]);

  const handleSendMessage = async () => {
    if (input.trim()) {
      if (buddy) {
        // For private messages, handle the async result
        const result = await (
          sendMessage as (
            content: string
          ) => Promise<{ success: boolean; error?: string }>
        )(input);
        if (result && result.success) {
          setInput("");
        } else {
          alert(result?.error || "Failed to send message");
        }
      } else {
        // For course messages, it's synchronous
        (sendMessage as (content: string) => void)(input);
        setInput("");
      }
    }
  };

  // Optimize input handling with useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [input]); // Add input as dependency since handleSendMessage uses it

  const handleEditMessage = (messageId: number, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingMessage) {
      const result = await editMessage(
        editingMessage.id,
        editingMessage.content
      );
      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingMessage(null);
      } else {
        alert(result.error || "Failed to edit message");
      }
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      const result = await deleteMessage(messageId);
      if (!result.success) {
        alert(result.error || "Failed to delete message");
      }
    }
  };

  // Show loading state while courses are being fetched or preferences are loading
  if (coursesLoading || !preferencesLoaded) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "text.secondary",
        }}
      >
        <Typography>
          {coursesLoading
            ? "Loading courses..."
            : "Loading chat preferences..."}
        </Typography>
      </Box>
    );
  }

  if (courses.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          textAlign: "center",
          p: 4,
        }}
      >
        <Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Enrolled Courses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't enrolled in any courses yet. Go to the "My Courses" tab
            to select courses and join the conversation!
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      {/* Main Chat Area */}
      <ChatContainer sx={{ flex: 1 }}>
        {/* Chat Header */}
        <ChatHeader>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TagIcon sx={{ color: "text.secondary" }} />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {buddy
                  ? `${buddy.displayName}`
                  : currentCourse?.name || "Select a Course"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {buddy
                  ? "Private Messages"
                  : `${messages.length} messages • ${connectedUsers} ${
                      connectedUsers === 1 ? "user" : "users"
                    } online`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Search Messages">
              <IconButton size="small">
                <SearchIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </ChatHeader>

        {/* Messages Area */}
        <MessagesContainer>
          {" "}
          {isLoading ? (
            <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
              Loading chat history...
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
              No messages yet. Start the conversation!
            </Box>
          ) : (
            messages.map((msg) => {
              const isOwnMessage =
                String(msg.senderId) === String(currentUserId);
              const displayName =
                "displayName" in msg ? msg.displayName : msg.senderName;
              return (
                <MessageGroup
                  key={msg.id}
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
                    ml: isOwnMessage ? 1.5 : 2,
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
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                  >
                    {" "}
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: isOwnMessage
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                        fontSize: "0.875rem",
                        fontWeight: 600,
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
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            color: isOwnMessage
                              ? theme.palette.primary.main
                              : "text.primary",
                          }}
                        >
                          {displayName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>{" "}
                        {"editedAt" in msg && msg.editedAt && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontStyle: "italic" }}
                          >
                            (edited)
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {msg.content}
                      </Typography>
                    </Box>
                    {isOwnMessage && (
                      <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
                        <Tooltip title="Edit message">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEditMessage(msg.id, msg.content)
                            }
                            sx={{
                              color: "text.secondary",
                              "&:hover": { color: "primary.main" },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete message">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMessage(msg.id)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { color: "error.main" },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </MessageGroup>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Message Input */}
        <MessageInput>
          {!buddy && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1,
                py: 0.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={isAnonymous}
                    onChange={(e) =>
                      handleAnonymousModeChange(e.target.checked)
                    }
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    Anonymous Mode
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              {isAnonymous && anonymousName && (
                <Chip
                  label={`🎭 ${anonymousName}`}
                  size="small"
                  color="warning"
                  sx={{ fontSize: "0.7rem", height: 24 }}
                />
              )}
            </Box>
          )}
          <Paper
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1,
              backgroundColor:
                theme.palette.mode === "dark" ? "#40444b" : "#ebedef",
              borderRadius: 2,
            }}
          >
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <AttachFileIcon />
            </IconButton>
            <TextField
              fullWidth
              variant="standard"
              placeholder={`Message ${currentCourse?.name || "course"}`}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3} // Reduced from 4 for better performance
              InputProps={{
                disableUnderline: true,
                sx: { px: 1 },
                autoComplete: "off", // Disable autocomplete for better performance
              }}
              sx={{
                // Optimize for performance
                '& .MuiInputBase-input': {
                  resize: 'none', // Prevent manual resizing
                }
              }}
            />
            <IconButton size="small">
              <EmojiEmotionsIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleSendMessage}
              disabled={!input.trim()}
              sx={{
                mr: 0.5,
                "&:not(:disabled)": {
                  color: theme.palette.primary.main,
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Paper>
        </MessageInput>
      </ChatContainer>

      {/* Edit Message Dialog */}
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
            fullWidth
            multiline
            rows={4}
            value={editingMessage?.content || ""}
            onChange={(e) =>
              setEditingMessage((prev) =>
                prev ? { ...prev, content: e.target.value } : null
              )
            }
            sx={{ mt: 1 }}
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
