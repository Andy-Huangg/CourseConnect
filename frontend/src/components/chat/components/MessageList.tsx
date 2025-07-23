import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { forwardRef } from "react";
import MessageItem from "./MessageItem";
import type { MessageListProps } from "../types";

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  padding: theme.spacing(0.5, 0),
  minHeight: 0,
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
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(0.25, 0),
  },
}));

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  (
    { messages, currentUserId, isLoading, onEditMessage, onDeleteMessage },
    ref
  ) => {
    if (isLoading) {
      return (
        <MessagesContainer>
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            Loading chat history...
          </Box>
        </MessagesContainer>
      );
    }

    if (messages.length === 0) {
      return (
        <MessagesContainer>
          <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
            No messages yet. Start the conversation!
          </Box>
        </MessagesContainer>
      );
    }

    return (
      <MessagesContainer>
        {messages.map((message) => {
          // Handle both course and private message types
          const senderId =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId.toString();
          const isOwnMessage = senderId === String(currentUserId);

          return (
            <MessageItem
              key={message.id}
              message={message}
              isOwnMessage={isOwnMessage}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
            />
          );
        })}
        <div ref={ref} />
      </MessagesContainer>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
