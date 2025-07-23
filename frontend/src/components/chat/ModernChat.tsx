import { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import SchoolIcon from "@mui/icons-material/School";
import {
  ChatHeader,
  MessageList,
  MessageInput,
  EditMessageDialog,
  useChatLogic,
} from "./index";
import LoadingState from "../ui/LoadingState";
import EmptyState from "../ui/EmptyState";
import type { ChatProps } from "./types";

// Styled components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  maxHeight: "100vh",
  backgroundColor:
    theme.palette.mode === "dark"
      ? "#36393f" // dark chat background
      : "#ffffff",
  [theme.breakpoints.down("md")]: {
    height: "calc(100vh - 64px)", // Account for mobile AppBar
  },
}));

export default function ModernChat({
  wsBase,
  selectedCourse: propSelectedCourse,
  buddy,
  markCourseMessageAsRead,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [editingMessage, setEditingMessage] = useState<{
    id: number;
    content: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use our custom hook for chat logic
  const {
    currentCourse,
    courses,
    isAnonymous,
    anonymousName,
    preferencesLoaded,
    coursesLoading,
    currentUserId,
    messages,
    isLoading,
    connectedUsers,
    connectionState,
    sendMessage,
    editMessage,
    deleteMessage,
    handleAnonymousModeChange,
  } = useChatLogic({
    wsBase,
    selectedCourse: propSelectedCourse,
    buddy,
    markCourseMessageAsRead,
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (input.trim()) {
      // Check connection for course chat
      if (!buddy && connectionState !== "connected") {
        alert(
          "Unable to send message: Chat is not connected. Please wait for connection to be restored."
        );
        return;
      }

      if (buddy) {
        // For private messages
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
        // For course messages
        const result = (
          sendMessage as (content: string) => {
            success: boolean;
            error?: string;
          }
        )(input);
        if (result.success) {
          setInput("");
        } else {
          alert(result.error || "Failed to send message");
        }
      }
    }
  }, [input, buddy, sendMessage, connectionState]);

  // Handle input changes
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Handle edit message
  const handleEditMessage = (messageId: number, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
    setIsEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async (messageId: number, content: string) => {
    const result = await editMessage(messageId, content);
    if (!result.success) {
      throw new Error(result.error || "Failed to edit message");
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: number) => {
    const result = await deleteMessage(messageId);
    if (!result.success) {
      alert(result.error || "Failed to delete message");
    }
  };

  // Generate placeholder text
  const getPlaceholder = () => {
    if (buddy) {
      return `Message ${buddy.displayName}`;
    }
    return connectionState === "connected"
      ? `Message ${currentCourse?.name || "course"}`
      : "Connecting to chat...";
  };

  // Show loading state
  if (coursesLoading || !preferencesLoaded) {
    return (
      <LoadingState
        message={
          coursesLoading ? "Loading courses..." : "Loading chat preferences..."
        }
      />
    );
  }

  // Show no courses state
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<SchoolIcon />}
        title="No Enrolled Courses"
        description="You haven't enrolled in any courses yet. Go to the My Courses tab to select courses and join the conversation!"
      />
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Main Chat Area */}
      <ChatContainer sx={{ flex: 1, minWidth: 0 }}>
        {/* Chat Header */}
        <ChatHeader
          buddy={buddy}
          currentCourse={currentCourse}
          connectionState={connectionState}
          messagesCount={messages.length}
          connectedUsers={connectedUsers}
        />

        {/* Messages Area */}
        <MessageList
          ref={messagesEndRef}
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />

        {/* Message Input */}
        <MessageInput
          input={input}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          placeholder={getPlaceholder()}
          buddy={buddy}
          currentCourse={currentCourse}
          isAnonymous={isAnonymous}
          anonymousName={anonymousName}
          onAnonymousModeChange={!buddy ? handleAnonymousModeChange : undefined}
        />
      </ChatContainer>

      {/* Edit Message Dialog */}
      <EditMessageDialog
        open={isEditDialogOpen}
        messageId={editingMessage?.id || null}
        initialContent={editingMessage?.content || ""}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingMessage(null);
        }}
        onSave={handleSaveEdit}
      />
    </Box>
  );
}
