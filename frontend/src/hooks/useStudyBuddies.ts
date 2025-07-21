import { useState, useEffect, useCallback } from "react";
import {
  useStudyBuddySocket,
  type StudyBuddyUpdateMessage,
} from "./useStudyBuddySocket";

interface StudyBuddy {
  id: number;
  courseId: number;
  courseName?: string;
  isOptedIn: boolean;
  buddy?: {
    id: number;
    username: string;
    displayName: string;
  };
  matchedAt?: string;
  contactPreference?: string;
}

interface Course {
  id: number;
  name: string;
  userCount?: number;
}

export function useStudyBuddies() {
  const [studyBuddies, setStudyBuddies] = useState<StudyBuddy[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/Course`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        return data;
      } else {
        throw new Error("Failed to fetch courses");
      }
    } catch {
      return [];
    }
  }, []);

  const fetchStudyBuddies = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("jwt");

      // Fetch both study buddies and courses in parallel
      const [studyBuddiesResponse, coursesData] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/StudyBuddy`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetchCourses(),
      ]);

      if (studyBuddiesResponse.ok) {
        const studyBuddiesData = await studyBuddiesResponse.json();

        // Enrich study buddies with course names
        const enrichedStudyBuddies = studyBuddiesData.map((sb: StudyBuddy) => {
          let courseName = coursesData.find(
            (course: Course) => course.id === sb.courseId
          )?.name;

          // Special handling for Global course
          if (!courseName && sb.courseId === 1) {
            courseName = "Global Chat";
          }

          return {
            ...sb,
            courseName: courseName || "Unknown Course",
          };
        });

        setStudyBuddies(enrichedStudyBuddies);
      } else {
        throw new Error("Failed to fetch study buddies");
      }
    } catch {
      setError("Failed to load study buddy information");
    } finally {
      setIsLoading(false);
    }
  }, [fetchCourses]);

  useEffect(() => {
    fetchStudyBuddies();
  }, [fetchStudyBuddies]);

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  // Handle WebSocket updates for real-time study buddy changes
  const handleStudyBuddyUpdate = useCallback(
    (update: StudyBuddyUpdateMessage) => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) return;

      const isForCurrentUser = update.userId === parseInt(currentUserId);
      const isCurrentUserBuddy =
        update.studyBuddy?.buddy?.id === parseInt(currentUserId);

      if (isForCurrentUser || isCurrentUserBuddy) {
        // Update state based on the WebSocket message
        if (update.studyBuddy) {
          setStudyBuddies((prev) => {
            const existing = prev.find((sb) => sb.courseId === update.courseId);

            // Find course name
            let courseName =
              courses.find((c) => c.id === update.courseId)?.name ||
              existing?.courseName;
            if (!courseName && update.courseId === 1) {
              courseName = "Global Chat";
            }
            if (!courseName) {
              courseName = `Course ${update.courseId}`;
            }

            if (existing) {
              // Update existing record
              return prev.map((sb) =>
                sb.courseId === update.courseId
                  ? {
                      ...existing,
                      ...update.studyBuddy!,
                      courseName: courseName,
                      id: existing.id, // Preserve existing ID
                    }
                  : sb
              );
            } else if (isForCurrentUser) {
              // Add new record for current user
              return [
                ...prev,
                {
                  ...update.studyBuddy!,
                  courseName: courseName,
                },
              ];
            }
            return prev;
          });
        } else {
          // Handle non-studyBuddy updates
          switch (update.updateType) {
            case "OPTED_OUT":
              if (isForCurrentUser) {
                setStudyBuddies((prev) =>
                  prev.filter((sb) => sb.courseId !== update.courseId)
                );
              }
              break;
            case "DISCONNECTED":
              setStudyBuddies((prev) =>
                prev.map((sb) =>
                  sb.courseId === update.courseId
                    ? { ...sb, buddy: undefined, matchedAt: undefined }
                    : sb
                )
              );
              break;
          }
        }
      }
    },
    [courses]
  );

  useStudyBuddySocket(handleStudyBuddyUpdate);

  // Get only matched study buddies (those with actual buddy connections)
  const matchedBuddies = studyBuddies.filter((sb) => sb.buddy != null);

  return {
    studyBuddies,
    matchedBuddies,
    courses,
    isLoading,
    error,
    refetch: fetchStudyBuddies,
  };
}
