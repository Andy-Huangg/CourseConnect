import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Check, Add, Remove, School } from "@mui/icons-material";

interface Course {
  id: number;
  name: string;
}

interface EnrollmentStatus {
  [courseId: number]: boolean;
}

export default function CourseEnrollment() {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("jwt");

  const fetchCoursesAndEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all courses
      const coursesResponse = await fetch(`${apiUrl}/api/Course`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!coursesResponse.ok) {
        throw new Error("Failed to fetch courses");
      }

      const coursesData: Course[] = await coursesResponse.json();
      setAllCourses(coursesData);

      // Fetch user's enrolled courses
      const enrolledResponse = await fetch(`${apiUrl}/api/Course/my-courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!enrolledResponse.ok) {
        throw new Error("Failed to fetch enrolled courses");
      }

      const enrolledData: Course[] = await enrolledResponse.json();
      // Filter out Global course (courseId = 1) from enrolled courses display
      const filteredEnrolledData = enrolledData.filter(
        (course) => course.id !== 1
      );
      setEnrolledCourses(filteredEnrolledData);

      // Create enrollment status mapping
      const statusMap: EnrollmentStatus = {};
      coursesData.forEach((course) => {
        statusMap[course.id] = enrolledData.some(
          (enrolled) => enrolled.id === course.id
        );
      });
      setEnrollmentStatus(statusMap);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchCoursesAndEnrollments();
  }, [fetchCoursesAndEnrollments]);

  const handleEnrollment = async (courseId: number, enroll: boolean) => {
    try {
      setActionLoading(courseId);
      setError(null);

      const method = enroll ? "POST" : "DELETE";
      const response = await fetch(`${apiUrl}/api/Course/${courseId}/enroll`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText ||
            `Failed to ${enroll ? "enroll in" : "unenroll from"} course`
        );
      }

      // Update enrollment status
      setEnrollmentStatus((prev) => ({
        ...prev,
        [courseId]: enroll,
      }));

      // Update enrolled courses list
      if (enroll) {
        const course = allCourses.find((c) => c.id === courseId);
        if (course) {
          setEnrolledCourses((prev) => [...prev, course]);
        }
      } else {
        setEnrolledCourses((prev) => prev.filter((c) => c.id !== courseId));
      }
    } catch (error) {
      console.error("Error updating enrollment:", error);
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${
              enroll ? "enroll in" : "unenroll from"
            } course. Please try again.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;

    try {
      setCreateLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/Course`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCourseName.trim() }),
      });

      if (response.ok) {
        const newCourse: Course = await response.json();

        // Add to all courses list
        setAllCourses((prev) => [...prev, newCourse]);

        // Auto-enroll in the new course
        await handleEnrollment(newCourse.id, true);

        // Close dialog and reset form
        setCreateDialogOpen(false);
        setNewCourseName("");
      } else if (response.status === 409) {
        const errorData = await response.json();
        setError(errorData.message || "Course already exists!");
      } else {
        throw new Error("Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      setError("Failed to create course. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Course Enrollment</Typography>
        <Button
          variant="contained"
          startIcon={<School />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Course
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Enrolled Courses Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            My Enrolled Courses ({enrolledCourses.length})
          </Typography>
          {enrolledCourses.length === 0 ? (
            <Typography color="text.secondary">
              You are not enrolled in any courses yet.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {enrolledCourses.map((course) => (
                <Chip
                  key={course.id}
                  label={course.name}
                  color="primary"
                  icon={<Check />}
                  sx={{ fontSize: "0.9rem" }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* All Courses Section */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        All Available Courses
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
          },
          gap: 2,
        }}
      >
        {allCourses.map((course) => {
          const isEnrolled = enrollmentStatus[course.id];
          const isLoading = actionLoading === course.id;

          return (
            <Card
              key={course.id}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: isEnrolled ? "2px solid" : "1px solid",
                borderColor: isEnrolled ? "primary.main" : "divider",
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {course.name}
                </Typography>
                {isEnrolled && (
                  <Chip
                    label="Enrolled"
                    color="primary"
                    size="small"
                    icon={<Check />}
                  />
                )}
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant={isEnrolled ? "outlined" : "contained"}
                  color={isEnrolled ? "secondary" : "primary"}
                  fullWidth
                  onClick={() => handleEnrollment(course.id, !isEnrolled)}
                  disabled={isLoading}
                  startIcon={
                    isLoading ? (
                      <CircularProgress size={16} />
                    ) : isEnrolled ? (
                      <Remove />
                    ) : (
                      <Add />
                    )
                  }
                >
                  {isLoading
                    ? "Loading..."
                    : isEnrolled
                    ? "Unenroll"
                    : "Enroll"}
                </Button>
              </Box>
            </Card>
          );
        })}
      </Box>

      {allCourses.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
          No courses available. Create your first course to get started!
        </Typography>
      )}

      {/* Create Course Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Create New Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            fullWidth
            variant="outlined"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            placeholder="e.g., CS150, Web Development, Math 101"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCourse}
            variant="contained"
            disabled={!newCourseName.trim() || createLoading}
            startIcon={createLoading ? <CircularProgress size={16} /> : <Add />}
          >
            {createLoading ? "Creating..." : "Create & Enroll"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
