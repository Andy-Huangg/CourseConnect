import { useState, useEffect, useCallback } from "react";
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
import { People, PersonAdd, PersonRemove, Chat } from "@mui/icons-material";
import { useCourses } from "../hooks/useCourses";
import {
  useStudyBuddySocket,
  type StudyBuddyUpdateMessage,
} from "../hooks/useStudyBuddySocket";
import PrivateChat from "./PrivateChat";

interface StudyBuddy {
  id: number;
  courseId: number;
  courseName?: string; // Make this optional to match the WebSocket interface
  isOptedIn: boolean;
  buddy?: {
    id: number;
    username: string;
    displayName: string;
    contactPreference?: string;
  };
  matchedAt?: string;
  contactPreference?: string;
}

interface Course {
  id: number;
  name: string;
  userCount?: number;
}

interface StudyBuddyProps {
  onChatBuddy?: (buddy: {
    id: number;
    username: string;
    displayName: string;
  }) => void;
}

export default function StudyBuddy({ onChatBuddy }: StudyBuddyProps = {}) {
  const [studyBuddies, setStudyBuddies] = useState<StudyBuddy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contactPreference, setContactPreference] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOptInDialogOpen, setIsOptInDialogOpen] = useState(false);
  const [chatBuddy, setChatBuddy] = useState<StudyBuddy["buddy"] | null>(null);

  const { enrolledCourses } = useCourses();

  // Helper function to get current user ID
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

  const fetchStudyBuddies = useCallback(async () => {
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
    } catch {
      setError("Failed to load study buddy information");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle study buddy WebSocket updates
  const handleStudyBuddyUpdate = useCallback(
    (update: StudyBuddyUpdateMessage) => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) return;

      // Check if this update affects any course the user is enrolled in
      // Global course (ID=1) should always be considered relevant
      const isRelevantCourse =
        update.courseId === 1 ||
        enrolledCourses.some((course) => course.id === update.courseId);

      if (isRelevantCourse) {
        // Update state directly based on the WebSocket message
        if (update.studyBuddy) {
          setStudyBuddies((prev) => {
            // Only process updates for the current user
            const isForCurrentUser = update.userId === parseInt(currentUserId);

            if (!isForCurrentUser) {
              return prev; // Not relevant to current user
            }

            const existing = prev.find((sb) => sb.courseId === update.courseId);

            // Find the course name for this courseId - check enrolled courses first
            const course = enrolledCourses.find(
              (c) => c.id === update.courseId
            );
            let courseName = course?.name || existing?.courseName;

            // Special handling for Global course (ID=1) if not found
            if (!courseName && update.courseId === 1) {
              courseName = "Global Chat";
            }

            // Final fallback
            if (!courseName) {
              courseName = `Course ${update.courseId}`;
            }

            const studyBuddyData = update.studyBuddy!; // We know it exists because of the if condition
            const updatedStudyBuddy: StudyBuddy = {
              id: studyBuddyData.id!,
              courseId: studyBuddyData.courseId!,
              courseName: courseName,
              isOptedIn: studyBuddyData.isOptedIn!,
              buddy: studyBuddyData.buddy,
              matchedAt: studyBuddyData.matchedAt,
              contactPreference: studyBuddyData.contactPreference,
            };

            if (existing) {
              // Update existing record
              return prev.map((sb) =>
                sb.courseId === update.courseId ? updatedStudyBuddy : sb
              );
            } else {
              // Add new record
              return [...prev, updatedStudyBuddy];
            }
          });
        } else {
          // If no studyBuddy data, handle based on update type
          switch (update.updateType) {
            case "OPTED_OUT":
              if (update.userId === parseInt(currentUserId)) {
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
    [enrolledCourses]
  );

  useStudyBuddySocket(handleStudyBuddyUpdate);

  useEffect(() => {
    fetchStudyBuddies();
  }, [fetchStudyBuddies]);

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
        const updatedStudyBuddy = await response.json();

        // Update the specific study buddy in the list
        setStudyBuddies((prev) => {
          const existing = prev.find((sb) => sb.courseId === courseId);
          if (existing) {
            // Update existing record
            return prev.map((sb) =>
              sb.courseId === courseId ? updatedStudyBuddy : sb
            );
          } else {
            // Add new record
            return [...prev, updatedStudyBuddy];
          }
        });

        setIsOptInDialogOpen(false);
        setContactPreference("");
        setSelectedCourse(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to opt in");
      }
    } catch (error) {
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
        // The WebSocket will handle the real-time update
        // No need to refresh data manually
      } else {
        throw new Error("Failed to opt out");
      }
    } catch {
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
        // The WebSocket will handle the real-time update
        // No need to refresh data manually
      } else {
        throw new Error("Failed to remove study buddy connection");
      }
    } catch {
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

  // Show private chat if a buddy is selected
  if (chatBuddy) {
    return (
      <Box
        sx={{
          height: { xs: "calc(100vh - 64px)", md: "calc(100vh - 120px)" },
          minHeight: 0,
        }}
      >
        <PrivateChat buddy={chatBuddy} onBack={() => setChatBuddy(null)} />
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
                    {/* Only show "Looking for study buddy" chip if no buddy is found yet */}
                    {!hasBuddy && (
                      <Chip
                        label="Looking for study buddy"
                        color="primary"
                        sx={{ mb: 2 }}
                      />
                    )}

                    {hasBuddy ? (
                      <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <strong>Study Buddy Found!</strong>
                          <br />
                          You're connected with{" "}
                          <strong>{studyBuddy?.buddy?.displayName}</strong>
                          {studyBuddy?.buddy?.contactPreference && (
                            <>
                              <br />
                              Contact: {studyBuddy.buddy.contactPreference}
                            </>
                          )}
                        </Alert>

                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              if (studyBuddy?.buddy) {
                                if (onChatBuddy) {
                                  onChatBuddy(studyBuddy.buddy);
                                } else {
                                  setChatBuddy(studyBuddy.buddy);
                                }
                              }
                            }}
                            disabled={isLoading}
                            startIcon={
                              isLoading ? (
                                <CircularProgress size={16} />
                              ) : (
                                <Chat />
                              )
                            }
                          >
                            Chat
                          </Button>
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
