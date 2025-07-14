import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Chat as ChatIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useCourses } from "../hooks/useCourses";

const OverviewContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  height: "100%",
  overflow: "auto",
  backgroundColor: theme.palette.background.default,
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background:
    theme.palette.mode === "dark"
      ? "linear-gradient(135deg, rgba(153, 102, 204, 0.1) 0%, rgba(102, 51, 153, 0.05) 100%)"
      : "linear-gradient(135deg, rgba(102, 51, 153, 0.1) 0%, rgba(153, 102, 204, 0.05) 100%)",
  border: `1px solid ${theme.palette.divider}`,
}));

const CourseCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 8px 25px rgba(0, 0, 0, 0.3)"
        : "0 8px 25px rgba(0, 0, 0, 0.1)",
  },
  border: `1px solid ${theme.palette.divider}`,
}));

const StatsCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  background:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.02)"
      : "rgba(102, 51, 153, 0.03)",
  border: `1px solid ${theme.palette.divider}`,
}));

interface CourseOverviewProps {
  onCourseSelect: (courseId: number) => void;
  onManageCourses: () => void;
}

export default function CourseOverview({
  onCourseSelect,
  onManageCourses,
}: CourseOverviewProps) {
  const theme = useTheme();
  const { enrolledCourses, isLoading } = useCourses();

  const handleCourseClick = (courseId: number) => {
    onCourseSelect(courseId);
  };

  if (isLoading) {
    return (
      <OverviewContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50%",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Loading your courses...
          </Typography>
        </Box>
      </OverviewContainer>
    );
  }

  return (
    <OverviewContainer>
      {/* Courses Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          mt: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Your Courses
        </Typography>
        <Button
          variant="outlined"
          onClick={onManageCourses}
          startIcon={<AssignmentIcon />}
        >
          Manage Enrollments
        </Button>
      </Box>

      {enrolledCourses.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, px: 4 }}>
          <AssignmentIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 3 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses enrolled yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
            Get started by enrolling in your first course to connect with
            classmates.
          </Typography>
          <Button variant="contained" onClick={onManageCourses} size="large">
            Browse & Enroll in Courses
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fit, minmax(320px, 1fr))",
              lg: "repeat(auto-fit, minmax(350px, 1fr))",
            },
            gap: 4,
            mt: 2,
          }}
        >
          {enrolledCourses.map((course) => (
            <CourseCard
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      mr: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {course.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 1 }}>
                      {course.name}
                    </Typography>
                    <Chip
                      label={`${course.userCount || 0} students`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.6 }}
                >
                  Join the conversation with your classmates, share resources,
                  and collaborate on assignments.
                </Typography>

                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Chip
                    icon={<ChatIcon />}
                    label="Active Chat"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<PeopleIcon />}
                    label="Study Groups"
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={() => handleCourseClick(course.id)}
                  sx={{ py: 1.5 }}
                >
                  Go To Chat
                </Button>
              </CardActions>
            </CourseCard>
          ))}
        </Box>
      )}
    </OverviewContainer>
  );
}
