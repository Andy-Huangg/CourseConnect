import React, { createContext, useState, useEffect, useCallback } from "react";
import { useAppSelector } from "../app/hooks";

interface Course {
  id: number;
  name: string;
  userCount?: number;
}

interface CourseContextType {
  allCourses: Course[];
  enrolledCourses: Course[];
  isLoading: boolean;
  error: string | null;
  refreshCourses: () => Promise<void>;
  updateEnrollment: (courseId: number, isEnrolled: boolean) => void;
  addNewCourse: (course: Course) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export { CourseContext };

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Get auth state from Redux instead of localStorage directly
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  const fetchCourses = useCallback(
    async (force = false) => {
      // Don't fetch if not authenticated
      if (!isAuthenticated || !token) {
        return;
      }

      // Cache duration: 5 minutes
      const CACHE_DURATION = 5 * 60 * 1000;

      // Skip if data is fresh and not forced
      if (
        !force &&
        Date.now() - lastFetch < CACHE_DURATION &&
        allCourses.length > 0
      ) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Parallel API calls for better performance
        const [coursesResponse, enrolledResponse] = await Promise.all([
          fetch(`${apiUrl}/api/Course`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${apiUrl}/api/Course/my-courses`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!coursesResponse.ok || !enrolledResponse.ok) {
          // Handle 401 specifically - don't show error for unauthorized requests
          if (coursesResponse.status === 401 || enrolledResponse.status === 401) {
            // Token is invalid/expired, let auth handle this
            return;
          }
          throw new Error("Failed to fetch courses");
        }

        const [coursesData, enrolledData] = await Promise.all([
          coursesResponse.json(),
          enrolledResponse.json(),
        ]);

        setAllCourses(coursesData);
        setEnrolledCourses(enrolledData);
        setLastFetch(Date.now());
      } catch (error) {
        // Only set error for non-auth related issues
        if (error instanceof Error && !error.message.includes("401")) {
          setError("Failed to load courses. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, token, isAuthenticated, lastFetch, allCourses.length]
  );

  // Initial fetch - only when authenticated with a small delay to ensure auth state is settled
  useEffect(() => {
    if (isAuthenticated && token) {
      // Small delay to ensure auth state is fully settled
      const timeoutId = setTimeout(() => {
        fetchCourses();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clear courses when not authenticated
      setAllCourses([]);
      setEnrolledCourses([]);
      setError(null);
    }
  }, [fetchCourses, isAuthenticated, token]);

  const refreshCourses = useCallback(() => {
    return fetchCourses(true);
  }, [fetchCourses]);

  const updateEnrollment = useCallback(
    (courseId: number, isEnrolled: boolean) => {
      if (isEnrolled) {
        // Add to enrolled courses
        const course = allCourses.find((c) => c.id === courseId);
        if (course && !enrolledCourses.some((c) => c.id === courseId)) {
          setEnrolledCourses((prev) => [...prev, course]);
        }
      } else {
        // Remove from enrolled courses
        setEnrolledCourses((prev) => prev.filter((c) => c.id !== courseId));
      }
    },
    [allCourses, enrolledCourses]
  );

  const addNewCourse = useCallback((course: Course) => {
    setAllCourses((prev) => [...prev, course]);
    setEnrolledCourses((prev) => [...prev, course]); // Auto-enroll in new courses
  }, []);

  const value: CourseContextType = {
    allCourses,
    enrolledCourses,
    isLoading,
    error,
    refreshCourses,
    updateEnrollment,
    addNewCourse,
  };

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}
