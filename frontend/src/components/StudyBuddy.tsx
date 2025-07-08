import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { People, PersonAdd, PersonRemove } from "@mui/icons-material";
import { useCourses } from "../hooks/useCourses";

interface StudyBuddy {
  id: number;
  courseId: number;
  courseName: string;
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

export default function StudyBuddy() {
  const [studyBuddies, setStudyBuddies] = useState<StudyBuddy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contactPreference, setContactPreference] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOptInDialogOpen, setIsOptInDialogOpen] = useState(false);

  const { enrolledCourses } = useCourses();

  const fetchStudyBuddies = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/StudyBuddy`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudyBuddies(data);
      } else {
        throw new Error("Failed to fetch study buddies");
      }
    } catch (error) {
      console.error("Error fetching study buddies:", error);
      setError("Failed to load study buddy information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyBuddies();
  }, []);

  const handleOptIn = async (courseId: number, contactPref?: string) => {
    try {
      setActionLoading(courseId);
      setError(null);

      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/StudyBuddy/opt-in`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            isOptedIn: true,
            contactPreference: contactPref || contactPreference,
          }),
        }
      );

      if (response.ok) {
        await fetchStudyBuddies(); // Refresh data
        setIsOptInDialogOpen(false);
        setContactPreference("");
        setSelectedCourse(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to opt in");
      }
    } catch (error) {
      console.error("Error opting in:", error);
      setError(error instanceof Error ? error.message : "Failed to opt in");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOptOut = async (courseId: number) => {
    try {
      setActionLoading(courseId);
      setError(null);

      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/StudyBuddy/opt-out`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseId }),
        }
      );

      if (response.ok) {
        await fetchStudyBuddies(); // Refresh data
      } else {
        throw new Error("Failed to opt out");
      }
    } catch (error) {
      console.error("Error opting out:", error);
      setError("Failed to opt out");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMatch = async (courseId: number) => {
    try {
      setActionLoading(courseId);
      setError(null);

      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/StudyBuddy/remove-match`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseId }),
        }
      );

      if (response.ok) {
        await fetchStudyBuddies(); // Refresh data
      } else {
        throw new Error("Failed to remove study buddy connection");
      }
    } catch (error) {
      console.error("Error removing match:", error);
      setError("Failed to remove study buddy connection");
    } finally {
      setActionLoading(null);
    }
  };

  const openOptInDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsOptInDialogOpen(true);
  };

  const getStudyBuddyForCourse = (courseId: number) => {
    return studyBuddies.find((sb) => sb.courseId === courseId);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <People sx={{ fontSize: 32 }} />
        <Typography variant="h4">Study Buddies</Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
        Connect with classmates for collaborative learning! Opt in to find a
        study partner for each course. The system will randomly match you with
        another student looking for a study buddy.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 3,
        }}
      >
        {enrolledCourses.map((course) => {
          const studyBuddy = getStudyBuddyForCourse(course.id);
          const isOptedIn = studyBuddy?.isOptedIn || false;
          const hasBuddy = studyBuddy?.buddy != null;
          const isLoading = actionLoading === course.id;

          return (
            <Card
              key={course.id}
              sx={{
                height: "100%",
                border: isOptedIn ? "2px solid" : "1px solid",
                borderColor: isOptedIn ? "primary.main" : "divider",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {course.name}
                  {course.id === 1 && " (Global Chat)"}
                </Typography>

                {course.userCount !== undefined && (
                  <Chip
                    label={`${course.userCount} ${
                      course.userCount === 1 ? "student" : "students"
                    } enrolled`}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}

                {isOptedIn ? (
                  <Box>
                    <Chip
                      label="Looking for study buddy"
                      color="primary"
                      sx={{ mb: 2 }}
                    />

                    {hasBuddy ? (
                      <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <strong>Study Buddy Found!</strong>
                          <br />
                          You're connected with{" "}
                          <strong>{studyBuddy?.buddy?.displayName}</strong>
                          {studyBuddy?.contactPreference && (
                            <>
                              <br />
                              Contact: {studyBuddy.contactPreference}
                            </>
                          )}
                        </Alert>

                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleRemoveMatch(course.id)}
                            disabled={isLoading}
                            startIcon={
                              isLoading ? (
                                <CircularProgress size={16} />
                              ) : (
                                <PersonRemove />
                              )
                            }
                          >
                            Remove Connection
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Waiting for a study buddy match...
                        </Typography>

                        {studyBuddy?.contactPreference && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            Contact preference: {studyBuddy.contactPreference}
                          </Typography>
                        )}

                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleOptOut(course.id)}
                          disabled={isLoading}
                          startIcon={
                            isLoading ? (
                              <CircularProgress size={16} />
                            ) : (
                              <PersonRemove />
                            )
                          }
                        >
                          Opt Out
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Join the study buddy program to connect with a classmate
                      for collaborative learning.
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={() => openOptInDialog(course)}
                      disabled={isLoading}
                      startIcon={
                        isLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <PersonAdd />
                        )
                      }
                    >
                      Find Study Buddy
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {enrolledCourses.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          You need to enroll in courses first to find study buddies. Go to the
          "My Courses" tab to join some courses!
        </Alert>
      )}

      {/* Opt-in Dialog */}
      <Dialog
        open={isOptInDialogOpen}
        onClose={() => setIsOptInDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Join Study Buddy Program</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You're about to join the study buddy program for{" "}
            <strong>{selectedCourse?.name}</strong>. The system will randomly
            match you with another student looking for a study partner.
          </Typography>

          <TextField
            label="Contact Preference (Optional)"
            fullWidth
            multiline
            rows={2}
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value)}
            placeholder="e.g., Discord: username#1234, Email: example@email.com"
            sx={{ mt: 2 }}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            This will be shared with your study buddy to help you connect.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOptInDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedCourse &&
              handleOptIn(selectedCourse.id, contactPreference)
            }
            variant="contained"
            disabled={actionLoading === selectedCourse?.id}
          >
            {actionLoading === selectedCourse?.id ? (
              <CircularProgress size={20} />
            ) : (
              "Join Program"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
