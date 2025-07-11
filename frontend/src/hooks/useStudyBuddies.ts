import { useState, useEffect, useCallback } from "react";

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
    } catch (error) {
      console.error("Error fetching courses:", error);
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
        const enrichedStudyBuddies = studyBuddiesData.map((sb: StudyBuddy) => ({
          ...sb,
          courseName:
            coursesData.find((course: Course) => course.id === sb.courseId)
              ?.name || "Unknown Course",
        }));

        setStudyBuddies(enrichedStudyBuddies);
      } else {
        throw new Error("Failed to fetch study buddies");
      }
    } catch (error) {
      console.error("Error fetching study buddies:", error);
      setError("Failed to load study buddy information");
    } finally {
      setIsLoading(false);
    }
  }, [fetchCourses]);

  useEffect(() => {
    fetchStudyBuddies();
  }, [fetchStudyBuddies]);

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
