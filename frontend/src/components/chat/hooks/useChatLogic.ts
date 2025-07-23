import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useCourses } from "../../../hooks/useCourses";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { usePrivateMessages } from "../../../hooks/usePrivateMessages";
import { useNewMessageIndicatorsContext } from "../../../hooks/useNewMessageIndicatorsContext";
import { useAppSelector } from "../../../app/hooks";
import type { ChatProps, ConnectionState } from "../types";

export function useChatLogic({
  wsBase,
  selectedCourse: propSelectedCourse,
  buddy,
  markCourseMessageAsRead,
}: ChatProps) {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(
    propSelectedCourse || null
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [anonymousName, setAnonymousName] = useState<string>("");
  const { token } = useAppSelector((state) => state.auth);

  const getCurrentUserId = useCallback(() => {
    try {
      const jwtToken = token || localStorage.getItem("jwt");
      if (!jwtToken) return null;

      const payload = JSON.parse(atob(jwtToken.split(".")[1]));
      return payload.userId;
    } catch {
      return null;
    }
  }, [token]);

  const currentUserId = useMemo(() => getCurrentUserId(), [getCurrentUserId]);
  const { enrolledCourses, isLoading: coursesLoading } = useCourses();
  const courses = useMemo(() => enrolledCourses, [enrolledCourses]);
  const currentCourse = useMemo(
    () => enrolledCourses.find((course) => course.id === selectedCourse),
    [enrolledCourses, selectedCourse]
  );

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedCourse && propSelectedCourse !== selectedCourse) {
      setSelectedCourse(propSelectedCourse);
    }
  }, [propSelectedCourse, selectedCourse]);

  // WebSocket URL for course chat
  const wsUrl = buddy
    ? null
    : selectedCourse && preferencesLoaded
    ? `${wsBase}?courseId=${selectedCourse}`
    : null;

  // Chat hooks
  const {
    messages: courseMessages,
    sendMessage: sendCourseMessage,
    editMessage: editCourseMessage,
    deleteMessage: deleteCourseMessage,
    isLoading: courseLoading,
    connectedUsers,
    connectionState,
  } = useChatSocket(wsUrl, buddy ? null : selectedCourse, isAnonymous, token);

  const {
    messages: privateMessages,
    sendMessage: sendPrivateMessage,
    editMessage: editPrivateMessage,
    deleteMessage: deletePrivateMessage,
    isLoading: privateLoading,
    markAsRead: markPrivateMessageAsRead,
  } = usePrivateMessages(buddy?.id, token);

  // New message indicators
  const { handleCourseMessageUpdate } = useNewMessageIndicatorsContext();
  const previousMessageCountRef = useRef(0);

  // Track new course messages
  useEffect(() => {
    if (!buddy && selectedCourse && courseMessages.length > 0) {
      const currentMessageCount = courseMessages.length;
      const previousCount = previousMessageCountRef.current;

      if (currentMessageCount > previousCount && previousCount > 0) {
        const newMessage = courseMessages[courseMessages.length - 1];
        handleCourseMessageUpdate(selectedCourse, newMessage.senderId);
      }

      previousMessageCountRef.current = currentMessageCount;
    }
  }, [courseMessages, buddy, selectedCourse, handleCourseMessageUpdate]);

  // Determine which data to use
  const messages = buddy ? privateMessages : courseMessages;
  const isLoading = buddy ? privateLoading : courseLoading;
  const sendMessage = useMemo(
    () =>
      buddy
        ? (content: string) => sendPrivateMessage(buddy.id, content)
        : sendCourseMessage,
    [buddy, sendPrivateMessage, sendCourseMessage]
  );
  const editMessage = buddy ? editPrivateMessage : editCourseMessage;
  const deleteMessage = buddy ? deletePrivateMessage : deleteCourseMessage;

  // Anonymous name fetching
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
    } catch {
      setAnonymousName("");
    }
  };

  // Load preferences
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

  // Anonymous mode handler
  const handleAnonymousModeChange = (checked: boolean) => {
    setIsAnonymous(checked);
    if (selectedCourse) {
      localStorage.setItem(
        `anonymousMode_${selectedCourse}`,
        checked.toString()
      );
    }
  };

  // Set default course
  useEffect(() => {
    if (!selectedCourse && courses.length > 0) {
      const defaultCourse = courses[0].id;
      setSelectedCourse(defaultCourse);
    }
  }, [selectedCourse, courses]);

  // Mark messages as read
  const unreadMessageIds = useMemo(() => {
    if (messages.length === 0 || !currentUserId) return [];

    if (buddy) {
      return messages
        .filter(
          (msg) =>
            msg.senderId !== currentUserId.toString() &&
            "isRead" in msg &&
            !msg.isRead
        )
        .slice(-3)
        .map((msg) => msg.id);
    } else {
      return messages
        .filter((msg) => msg.senderId !== currentUserId.toString())
        .slice(-5)
        .map((msg) => msg.id);
    }
  }, [messages, currentUserId, buddy]);

  useEffect(() => {
    if (unreadMessageIds.length === 0) return;

    const markMessagesAsReadDebounced = async () => {
      if (buddy && markPrivateMessageAsRead) {
        for (const msgId of unreadMessageIds) {
          try {
            await markPrivateMessageAsRead(msgId);
          } catch {
            // Ignore errors
          }
        }
      } else if (markCourseMessageAsRead && selectedCourse) {
        unreadMessageIds.forEach((msgId) => {
          markCourseMessageAsRead(msgId).catch(() => {});
        });
      }
    };

    const timeoutId = setTimeout(markMessagesAsReadDebounced, 3000);
    return () => clearTimeout(timeoutId);
  }, [
    unreadMessageIds,
    buddy,
    markPrivateMessageAsRead,
    markCourseMessageAsRead,
    selectedCourse,
  ]);

  return {
    // State
    selectedCourse,
    currentCourse,
    courses,
    isAnonymous,
    anonymousName,
    preferencesLoaded,
    coursesLoading,
    currentUserId,

    // Messages
    messages,
    isLoading,
    connectedUsers,
    connectionState: connectionState as ConnectionState,

    // Actions
    sendMessage,
    editMessage,
    deleteMessage,
    handleAnonymousModeChange,
  };
}
