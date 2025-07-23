import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Paper,
  Avatar,
  Chip,
  Stack,
  Fade,
  Slide,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import {
  Chat,
  Forum,
  ConnectWithoutContact,
  Speed,
  VisibilityOff,
  Message,
} from "@mui/icons-material";
import ThemeToggle from "./components/chat/components/ThemeToggle";
import { useAppSelector } from "./app/hooks";
import { useState, useEffect } from "react";

function App() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>([
    false,
    false,
    false,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleFeatures([true, true, true]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/signup");
    }
  };

  const handleJoinChat = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/signup");
    }
  };

  const handleFindBuddy = () => {
    if (isAuthenticated) {
      navigate("/home");
    } else {
      navigate("/signup");
    }
  };

  const features = [
    {
      icon: <Speed sx={{ fontSize: 50, color: "primary.main" }} />,
      title: "Real-time Course Chatrooms",
      description:
        "Join instant WebSocket-powered conversations with classmates in your specific courses. No delays, just seamless communication.",
      highlight: "Powered by WebSockets",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      icon: <VisibilityOff sx={{ fontSize: 50, color: "secondary.main" }} />,
      title: "Anonymous Participation",
      description:
        "Participate freely as fun animal avatars like 'Green Panda' or 'Blue Fox'. Ask questions without judgment.",
      highlight: "Stay Anonymous",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      icon: (
        <ConnectWithoutContact sx={{ fontSize: 50, color: "success.main" }} />
      ),
      title: "Study Buddy Matching",
      description:
        "Get matched with the perfect study partner in each course. Private 1-on-1 messaging for focused collaboration.",
      highlight: "Smart Matching",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
  ];

  const liveMessages = [
    {
      avatar: "G",
      name: "Green Panda",
      message: "Anyone know the deadline for assignment 2?",
      time: "2m ago",
    },
    {
      avatar: "B",
      name: "Blue Fox",
      message: "It's next Friday! I can share my notes",
      time: "1m ago",
    },
    {
      avatar: "P",
      name: "Purple Koala",
      message: "Thanks! Study group tomorrow?",
      time: "30s ago",
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
          py: { xs: 1, sm: 2 },
          px: { xs: 1.5, sm: 4 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(10px)",
          minHeight: { xs: 60, sm: 70 },
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(18, 18, 18, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Forum sx={{ color: "white", fontSize: { xs: 20, sm: 24 } }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            CourseConnect
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 2 },
            flexShrink: 0,
          }}
        >
          <ThemeToggle />
          {isAuthenticated ? (
            <Button
              component={Link}
              to="/home"
              variant="contained"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                minWidth: { xs: "auto", sm: "64px" },
                px: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                height: { xs: 32, sm: 36 },
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                },
              }}
            >
              Dashboard
            </Button>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 2 },
              }}
            >
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="small"
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  minWidth: { xs: "auto", sm: "64px" },
                  px: { xs: 1.25, sm: 2 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  height: { xs: 32, sm: 36 },
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                  },
                }}
              >
                Sign Up
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "primary.main",
                  minWidth: { xs: "auto", sm: "64px" },
                  px: { xs: 1.25, sm: 2 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  height: { xs: 32, sm: 36 },
                }}
              >
                Login
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          minHeight: { xs: "calc(100vh - 60px)", sm: "calc(100vh - 70px)" },
          background:
            "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            right: "10%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            opacity: 0.1,
            animation: "float 6s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-20px)" },
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            opacity: 0.1,
            animation: "float 4s ease-in-out infinite reverse",
          }}
        />

        <Container
          maxWidth="lg"
          sx={{ py: { xs: 4, sm: 8 }, position: "relative", zIndex: 1 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: 6,
            }}
          >
            <Box sx={{ flex: 1, maxWidth: { md: "50%" } }}>
              <Fade in timeout={1000}>
                <Box>
                  <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                      mb: 3,
                      fontWeight: "bold",
                      fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
                      lineHeight: 1.1,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Connect.
                    <br />
                    Chat.
                    <br />
                    Study Together.
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      color: "text.secondary",
                      fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" },
                      lineHeight: 1.6,
                      maxWidth: "500px",
                    }}
                  >
                    Join real-time course chatrooms, participate anonymously,
                    and find your perfect study buddy.
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ mb: 4 }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleJoinChat}
                      startIcon={<Chat />}
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 3, sm: 4 },
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: "bold",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                          boxShadow: "0 12px 40px rgba(102, 126, 234, 0.4)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Join the Chat
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleFindBuddy}
                      startIcon={<ConnectWithoutContact />}
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 3, sm: 4 },
                        fontSize: { xs: "1rem", sm: "1.1rem" },
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: "bold",
                        borderWidth: 2,
                        "&:hover": {
                          borderWidth: 2,
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Find Study Buddy
                    </Button>
                  </Stack>
                </Box>
              </Fade>
            </Box>
            <Box sx={{ flex: 1, maxWidth: { md: "50%" } }}>
              <Slide direction="left" in timeout={1200}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background:
                      theme.palette.mode === "dark"
                        ? "rgba(18, 18, 18, 0.9)"
                        : "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    border:
                      theme.palette.mode === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Message color="primary" />
                    CS101 - Introduction to Programming
                  </Typography>
                  <Stack spacing={2}>
                    {liveMessages.map((msg, index) => (
                      <Fade key={index} in timeout={1500 + index * 200}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? "rgba(102, 126, 234, 0.15)"
                                : "rgba(102, 126, 234, 0.05)",
                            border:
                              theme.palette.mode === "dark"
                                ? "1px solid rgba(102, 126, 234, 0.25)"
                                : "1px solid rgba(102, 126, 234, 0.1)",
                          }}
                        >
                          <Avatar
                            sx={{ width: 32, height: 32, fontSize: "1rem" }}
                          >
                            {msg.avatar}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: "bold",
                                  color: "primary.main",
                                }}
                              >
                                {msg.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {msg.time}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.primary">
                              {msg.message}
                            </Typography>
                          </Box>
                        </Box>
                      </Fade>
                    ))}
                  </Stack>
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%": { opacity: 1 },
                          "50%": { opacity: 0.5 },
                          "100%": { opacity: 1 },
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Real-time conversation
                    </Typography>
                  </Box>
                </Card>
              </Slide>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, sm: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              mb: 3,
              fontWeight: "bold",
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Powerful Features for Student Connection
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: "600px",
              mx: "auto",
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            Everything you need to connect, communicate, and collaborate with
            your classmates.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 4,
            mb: 8,
          }}
        >
          {features.map((feature, index) => (
            <Fade
              key={index}
              in={visibleFeatures[index]}
              timeout={1000 + index * 200}
            >
              <Card
                sx={{
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 4,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: feature.gradient,
                  },
                }}
              >
                <CardContent
                  sx={{ p: 4, textAlign: "center", position: "relative" }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: feature.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                      position: "relative",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 4,
                        borderRadius: "50%",
                        background: "background.paper",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    }}
                  >
                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      {feature.icon}
                    </Box>
                  </Box>
                  <Chip
                    label={feature.highlight}
                    size="small"
                    sx={{
                      mb: 2,
                      background: feature.gradient,
                      color: "white",
                      fontWeight: "bold",
                      "& .MuiChip-label": { px: 2 },
                    }}
                  />
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
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
                    sx={{
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          ))}
        </Box>

        {/* CTA Section */}
        <Paper
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-50%",
              right: "-50%",
              width: "200%",
              height: "200%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              animation: "rotate 20s linear infinite",
              "@keyframes rotate": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                mb: 2,
                fontWeight: "bold",
                fontSize: { xs: "1.75rem", sm: "2.5rem" },
              }}
            >
              Ready to Transform Your Study Experience?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontSize: { xs: "1rem", sm: "1.25rem" },
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              Join thousands of students who are already connecting,
              collaborating, and succeeding together on CourseConnect.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                sx={{
                  py: 2,
                  px: 5,
                  fontSize: "1.1rem",
                  bgcolor: "white",
                  color: "primary.main",
                  fontWeight: "bold",
                  borderRadius: 3,
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  "&:hover": {
                    bgcolor: "grey.100",
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Connecting Now"}
              </Button>
            </Stack>
            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Chip
                label="✨ Free to Join"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label="🚀 Instant Access"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label="🔒 100% Secure"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          py: { xs: 4, sm: 6 },
          px: { xs: 2, sm: 4 },
          borderTop: 1,
          borderColor: "divider",
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            CourseConnect
          </Typography>
          <Typography variant="body2" color="text.secondary">
            "Connect Connect!"
          </Typography>
        </Box>

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
