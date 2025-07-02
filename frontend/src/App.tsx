import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Chat, Groups, School, Security } from "@mui/icons-material";
import ThemeToggle from "./components/ThemeToggle";
import { useAppSelector } from "./app/hooks";

function App() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/signup");
    }
  };

  const features = [
    {
      icon: <Chat sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Real-time Chat",
      description:
        "Connect instantly with classmates in your courses through seamless real-time messaging.",
    },
    {
      icon: <Groups sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Course Communities",
      description:
        "Join dedicated chat rooms for each of your university courses and collaborate with peers.",
    },
    {
      icon: <School sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Academic Focus",
      description:
        "Share study materials, discuss assignments, and support each other's learning journey.",
    },
    {
      icon: <Security sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Secure Platform",
      description:
        "Your conversations are protected with authentication and secure data handling.",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          py: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          bgcolor: "background.default",
          zIndex: 1000,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          CourseConnect
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 2 },
            flexWrap: "wrap",
          }}
        >
          <ThemeToggle />
          {isAuthenticated ? (
            <Button
              component={Link}
              to="/home"
              variant="contained"
              size="medium"
            >
              Home
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="medium"
              >
                Sign Up
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="medium"
              >
                Login
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          minHeight: { xs: "calc(100vh - 120px)", sm: "calc(100vh - 140px)" },
          background:
            "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 8 } }}>
          <Box sx={{ textAlign: "center", mb: { xs: 6, sm: 8 } }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                mb: 3,
                fontWeight: "bold",
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
                lineHeight: 1.1,
              }}
            >
              Connect with Your
              <Box
                component="span"
                sx={{ color: "primary.main", display: "block" }}
              >
                Course Mates
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                color: "text.secondary",
                maxWidth: "700px",
                mx: "auto",
                fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
                lineHeight: 1.4,
              }}
            >
              Join course-specific chat rooms, collaborate on assignments, and
              build study groups with students in your university classes.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                py: { xs: 1.5, sm: 2 },
                px: { xs: 3, sm: 5 },
                fontSize: { xs: "1rem", sm: "1.1rem" },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
                boxShadow: 3,
                "&:hover": { boxShadow: 6 },
              }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8 } }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{
            textAlign: "center",
            mb: 6,
            fontWeight: "bold",
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
          }}
        >
          Why Choose CourseConnect?
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: { xs: 3, sm: 4 },
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
                {feature.icon}
                <Typography
                  variant="h5"
                  component="h3"
                  sx={{
                    mt: 2,
                    mb: 2,
                    fontWeight: "bold",
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* CTA Section */}
        <Paper
          sx={{
            mt: { xs: 6, sm: 8 },
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: "bold",
              fontSize: { xs: "1.75rem", sm: "2.125rem" },
            }}
          >
            Ready to Connect?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.9,
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            Join thousands of students already collaborating on CourseConnect
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              py: { xs: 1.5, sm: 2 },
              px: { xs: 3, sm: 5 },
              fontSize: { xs: "1rem", sm: "1.1rem" },
              bgcolor: "background.paper",
              color: "primary.main",
              fontWeight: "bold",
              borderRadius: 2,
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            {isAuthenticated ? "Go to Home" : "Sign Up Now"}
          </Button>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
          borderTop: 1,
          borderColor: "divider",
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          Built by Andy
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
