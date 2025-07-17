import { useState, useCallback, useRef } from "react";
import { usePrivateMessageSocket } from "./usePrivateMessageSocket";
import type { PrivateMessageUpdateData } from "./usePrivateMessageSocket";
import { useGlobalCourseSocket } from "./useGlobalCourseSocket";
import type { CourseNotification } from "./useGlobalCourseSocket";

export interface NewMessageIndicators {
  // Course indicators - courseId -> hasNewMessages
  courseIndicators: { [courseId: string]: boolean };

  // Private message indicators - userId -> hasNewMessages
  privateIndicators: { [userId: string]: boolean };
}

export function useNewMessageIndicators() {
  const [indicators, setIndicators] = useState<NewMessageIndicators>({
    courseIndicators: {},
    privateIndicators: {},
  });

  const lastCheckTimeRef = useRef<{ [key: string]: number }>({});
  const THROTTLE_DELAY = 5000; // 5 seconds minimum between checks for same user/course

  // Handle real-time private message updates
  const handlePrivateMessageUpdate = useCallback(
    (update: PrivateMessageUpdateData) => {
      if (update.type === "PRIVATE_MESSAGE_NEW" && update.message) {
        const currentUserId = getCurrentUserId();
        if (currentUserId && update.message.recipientId === currentUserId) {
          // We received a new message, set indicator to true
          setIndicators((prev) => ({
            ...prev,
            privateIndicators: {
              ...prev.privateIndicators,
              [update.message!.senderId.toString()]: true,
            },
          }));
        }
      }
    },
    []
  );

  // Handle real-time course chat message updates
  const handleCourseMessageUpdate = useCallback(
    (courseId: number, senderId: string) => {
      const currentUserId = getCurrentUserId();
      if (currentUserId && parseInt(senderId) !== currentUserId) {
        // Someone else sent a message in this course, set indicator to true
        setIndicators((prev) => ({
          ...prev,
          courseIndicators: {
            ...prev.courseIndicators,
            [courseId.toString()]: true,
          },
        }));
      }
    },
    []
  );

  // Handle global course notifications (real-time notifications from any course)
  const handleGlobalCourseNotification = useCallback(
    (notification: CourseNotification) => {
      if (notification.type === "COURSE_MESSAGE_NOTIFICATION") {
        handleCourseMessageUpdate(
          notification.courseId,
          notification.senderId.toString()
        );
      }
    },
    [handleCourseMessageUpdate]
  );

  // Set up WebSocket connections for real-time updates
  usePrivateMessageSocket(handlePrivateMessageUpdate);
  useGlobalCourseSocket(handleGlobalCourseNotification);

  const getCurrentUserId = (): number | null => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return parseInt(payload.userId || payload.nameid);
    } catch {
      return null;
    }
  };

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("jwt");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const checkCourseIndicators = useCallback(
    async (courseIds: number[]) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const promises = courseIds.map(async (courseId) => {
          const response = await fetch(
            `${apiUrl}/api/Chat/has-new-messages/${courseId}`,
            { headers: getHeaders() }
          );
          if (response.ok) {
            const data = await response.json();
            return {
              courseId: courseId.toString(),
              hasNewMessages: data.hasNewMessages,
            };
          }
          return { courseId: courseId.toString(), hasNewMessages: false };
        });

        const results = await Promise.all(promises);

        const newCourseIndicators: { [courseId: string]: boolean } = {};
        results.forEach(({ courseId, hasNewMessages }) => {
          newCourseIndicators[courseId] = hasNewMessages;
        });

        setIndicators((prev) => ({
          ...prev,
          courseIndicators: newCourseIndicators,
        }));
      } catch (error) {
      }
    },
    [getHeaders]
  );

  const checkPrivateIndicators = useCallback(
    async (userIds: number[]) => {
      try {
        const now = Date.now();
        const filteredUserIds = userIds.filter((userId) => {
          const lastCheckKey = `private_${userId}`;
          const lastCheck = lastCheckTimeRef.current[lastCheckKey] || 0;
          return now - lastCheck > THROTTLE_DELAY;
        });

        if (filteredUserIds.length === 0) {
          return; // Skip if all users were checked recently
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        const promises = filteredUserIds.map(async (userId) => {
          const lastCheckKey = `private_${userId}`;
          lastCheckTimeRef.current[lastCheckKey] = now;

          const response = await fetch(
            `${apiUrl}/api/PrivateMessage/has-new-messages/${userId}`,
            { headers: getHeaders() }
          );
          if (response.ok) {
            const data = await response.json();
            return {
              userId: userId.toString(),
              hasNewMessages: data.hasNewMessages,
            };
          }
          return { userId: userId.toString(), hasNewMessages: false };
        });

        const results = await Promise.all(promises);

        const newPrivateIndicators: { [userId: string]: boolean } = {};
        results.forEach(({ userId, hasNewMessages }) => {
          newPrivateIndicators[userId] = hasNewMessages;
        });

        setIndicators((prev) => ({
          ...prev,
          privateIndicators: {
            ...prev.privateIndicators,
            ...newPrivateIndicators,
          },
        }));
      } catch (error) {
      }
    },
    [getHeaders]
  );

  const markCourseAsViewed = useCallback(
    async (courseId: number) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiUrl}/api/Chat/mark-course-viewed/${courseId}`,
          {
            method: "POST",
            headers: getHeaders(),
          }
        );

        if (response.ok) {
          // Clear the indicator for this course
          setIndicators((prev) => ({
            ...prev,
            courseIndicators: {
              ...prev.courseIndicators,
              [courseId.toString()]: false,
            },
          }));
        }
      } catch (error) {
      }
    },
    [getHeaders]
  );

  const markPrivateConversationAsViewed = useCallback(
    async (userId: number) => {
      // Immediately clear the indicator for better UX
      setIndicators((prev) => ({
        ...prev,
        privateIndicators: {
          ...prev.privateIndicators,
          [userId.toString()]: false,
        },
      }));

      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiUrl}/api/PrivateMessage/mark-conversation-viewed/${userId}`,
          {
            method: "POST",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          // If the API call fails, restore the indicator
          setIndicators((prev) => ({
            ...prev,
            privateIndicators: {
              ...prev.privateIndicators,
              [userId.toString()]: true,
            },
          }));
        }
      } catch (error) {
        // Restore the indicator on error
        setIndicators((prev) => ({
          ...prev,
          privateIndicators: {
            ...prev.privateIndicators,
            [userId.toString()]: true,
          },
        }));
      }
    },
    [getHeaders]
  );

  const getCourseIndicator = useCallback(
    (courseId: number): boolean => {
      return indicators.courseIndicators[courseId.toString()] || false;
    },
    [indicators.courseIndicators]
  );

  const getPrivateIndicator = useCallback(
    (userId: number): boolean => {
      return indicators.privateIndicators[userId.toString()] || false;
    },
    [indicators.privateIndicators]
  );

  return {
    indicators,
    checkCourseIndicators,
    checkPrivateIndicators,
    markCourseAsViewed,
    markPrivateConversationAsViewed,
    getCourseIndicator,
    getPrivateIndicator,
    handleCourseMessageUpdate,
  };
}
