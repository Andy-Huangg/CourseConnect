import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  Typography,
  IconButton,
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Chip,
} from "@mui/material";
import { styled, useTheme as useMuiTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import GroupsIcon from "@mui/icons-material/Groups";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SettingsIcon from "@mui/icons-material/Settings";
import TagIcon from "@mui/icons-material/Tag";
import HomeIcon from "@mui/icons-material/Home";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { logout } from "../../auth/authSlice";
import { useTheme } from "../../theme/ThemeContext";
import ThemeToggle from "../ThemeToggle";
import CourseEnrollment from "../CourseEnrollment";
import StudyBuddy from "../StudyBuddy";
import ModernChat from "../chat/ModernChat";
import CourseOverview from "../CourseOverview";
import { useCourses } from "../../hooks/useCourses";
import { useStudyBuddies } from "../../hooks/useStudyBuddies";

const drawerWidth = 280;

// Custom styled components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    backgroundColor:
      theme.palette.mode === "dark"
        ? "#202225" //  dark sidebar
        : "#f2f3f5", // Light sidebar
    borderRight: "none",
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: 64,
  cursor: "pointer", // Make it clickable
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const MainContent = styled(Box)({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0, // Prevent flex items from overflowing
});

const ContentArea = styled(Box)({
  flexGrow: 1,
  overflow: "hidden",
});

const UserProfileSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(32, 34, 37, 0.6)"
      : "rgba(242, 243, 245, 0.6)",
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5, 2.5, 1),
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
}));

type ActiveSection =
  | "overview"
  | "course-enrollment"
  | "chat"
  | "study-buddies";
type ChatMode = "course" | "private";

export default function ChatLayout() {
  const muiTheme = useMuiTheme();
  const { mode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [chatMode, setChatMode] = useState<ChatMode>("course");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedBuddy, setSelectedBuddy] = useState<{
    id: number;
    username: string;
    displayName: string;
  } | null>(null);
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { user } = useAppSelector((state) => state.auth);
  const { enrolledCourses } = useCourses();
  const { matchedBuddies } = useStudyBuddies();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogoClick = () => {
    setActiveSection("overview");
    setSelectedCourse(null);
    setSelectedBuddy(null);
  };

  const isActiveSection = (section: ActiveSection) => activeSection === section;

  const courseConnectColors = {
    light: {
      sidebarItem: "#6a7480",
      sidebarItemHover: "#4e5d94",
      sidebarItemActive: "#663399",
      sidebarItemActiveBg: "rgba(102, 51, 153, 0.1)",
    },
    dark: {
      sidebarItem: "#96989d",
      sidebarItemHover: "#b5bac1",
      sidebarItemActive: "#ffffff",
      sidebarItemActiveBg: "rgba(153, 102, 204, 0.15)",
    },
  };

  const sidebarItemStyle = {
    borderRadius: 1.5,
    mx: 1.5,
    mb: 0.5,
    transition: "all 0.2s ease",
    "&.Mui-selected": {
      backgroundColor: courseConnectColors[mode].sidebarItemActiveBg,
      color: courseConnectColors[mode].sidebarItemActive,
      "& .MuiListItemIcon-root": {
        color: courseConnectColors[mode].sidebarItemActive,
      },
    },
    "&:hover": {
      backgroundColor:
        mode === "dark"
          ? "rgba(79, 84, 92, 0.16)"
          : "rgba(114, 137, 218, 0.05)",
      color: courseConnectColors[mode].sidebarItemHover,
      "& .MuiListItemIcon-root": {
        color: courseConnectColors[mode].sidebarItemHover,
      },
    },
  };

  const drawer = (
    <>
      <SidebarHeader onClick={handleLogoClick}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          CourseConnect
        </Typography>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </SidebarHeader>

      <List sx={{ py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleSectionChange("overview")}
            sx={sidebarItemStyle}
            selected={isActiveSection("overview")}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: courseConnectColors[mode].sidebarItem,
              }}
            >
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Course Overview" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleSectionChange("course-enrollment")}
            sx={sidebarItemStyle}
            selected={isActiveSection("course-enrollment")}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: courseConnectColors[mode].sidebarItem,
              }}
            >
              <AddCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Course Enrollment" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleSectionChange("study-buddies")}
            sx={sidebarItemStyle}
            selected={isActiveSection("study-buddies")}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: courseConnectColors[mode].sidebarItem,
              }}
            >
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText primary="Study Buddies" />
          </ListItemButton>
        </ListItem>
      </List>

      <SectionHeader>My Courses</SectionHeader>

      <List sx={{ py: 1 }}>
        {enrolledCourses.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No courses enrolled"
              secondary="Click 'Course Enrollment' to join a course"
              primaryTypographyProps={{
                variant: "body2",
                color: "text.secondary",
              }}
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItem>
        ) : (
          enrolledCourses.map((course) => (
            <ListItem key={course.id} disablePadding>
              <ListItemButton
                onClick={() => {
                  setSelectedCourse(course.id);
                  setChatMode("course");
                  setActiveSection("chat");
                }}
                sx={{
                  ...sidebarItemStyle,
                  "&.Mui-selected": {
                    backgroundColor:
                      courseConnectColors[mode].sidebarItemActiveBg,
                    color: courseConnectColors[mode].sidebarItemActive,
                  },
                }}
                selected={
                  activeSection === "chat" &&
                  chatMode === "course" &&
                  selectedCourse === course.id
                }
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: courseConnectColors[mode].sidebarItem,
                  }}
                >
                  <TagIcon />
                </ListItemIcon>
                <ListItemText
                  primary={course.name}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: selectedCourse === course.id ? 600 : 400,
                  }}
                />
                <Chip
                  label={course.userCount || 0}
                  size="small"
                  sx={{
                    fontSize: "0.7rem",
                    height: 20,
                    backgroundColor:
                      mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      {matchedBuddies.length > 0 && (
        <>
          <SectionHeader>Study Buddies</SectionHeader>
          <List sx={{ py: 1 }}>
            {matchedBuddies.map((studyBuddy) => (
              <ListItem
                key={`buddy-${studyBuddy.buddy?.id}-${studyBuddy.courseId}`}
                disablePadding
              >
                <ListItemButton
                  onClick={() => {
                    setSelectedBuddy(studyBuddy.buddy!);
                    setChatMode("private");
                    setActiveSection("chat");
                  }}
                  sx={{
                    ...sidebarItemStyle,
                    "&.Mui-selected": {
                      backgroundColor:
                        courseConnectColors[mode].sidebarItemActiveBg,
                      color: courseConnectColors[mode].sidebarItemActive,
                    },
                  }}
                  selected={
                    activeSection === "chat" &&
                    chatMode === "private" &&
                    selectedBuddy?.id === studyBuddy.buddy?.id
                  }
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: courseConnectColors[mode].sidebarItem,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: "0.75rem",
                        backgroundColor: muiTheme.palette.secondary.main,
                      }}
                    >
                      {studyBuddy.buddy?.displayName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={studyBuddy.buddy?.displayName}
                    secondary={studyBuddy.courseName}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight:
                        selectedBuddy?.id === studyBuddy.buddy?.id ? 600 : 400,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Box sx={{ flexGrow: 1 }} />

      <UserProfileSection>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            backgroundColor: muiTheme.palette.primary.main,
            fontSize: "0.875rem",
          }}
        >
          {user?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Online
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Settings">
            <IconButton
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sign out">
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "error.main" },
              }}
            >
              <ExitToAppIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <ThemeToggle />
        </Box>
      </UserProfileSection>
    </>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <Box sx={{ height: "100%", overflow: "auto" }}>
            <CourseOverview
              onCourseSelect={(courseId) => {
                setSelectedCourse(courseId);
                setChatMode("course");
                setActiveSection("chat");
              }}
              onManageCourses={() => {
                setActiveSection("course-enrollment");
              }}
            />
          </Box>
        );
      case "course-enrollment":
        return (
          <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
            <CourseEnrollment />
          </Box>
        );
      case "chat":
        if (chatMode === "course" && selectedCourse) {
          return (
            <ModernChat
              wsBase={`${import.meta.env.VITE_API_URL?.replace(
                "http",
                "ws"
              )}/ws/chat`}
              selectedCourse={selectedCourse}
            />
          );
        } else if (chatMode === "private" && selectedBuddy) {
          return (
            <ModernChat
              wsBase={`${import.meta.env.VITE_API_URL?.replace(
                "http",
                "ws"
              )}/ws/private`}
              buddy={selectedBuddy}
            />
          );
        }
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Select a course or study buddy to start chatting
            </Typography>
          </Box>
        );
      case "study-buddies":
        return (
          <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
            <StudyBuddy
              onChatBuddy={(buddy) => {
                setSelectedBuddy(buddy);
                setChatMode("private");
                setActiveSection("chat");
              }}
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Welcome to CourseConnect
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            display: { md: "none" },
            backgroundColor: muiTheme.palette.background.paper,
            color: muiTheme.palette.text.primary,
            boxShadow: "none",
            borderBottom: `1px solid ${muiTheme.palette.divider}`,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="primary"
              onClick={handleLogoClick}
              sx={{ cursor: "pointer" }}
            >
              CourseConnect
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar / Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor:
                mode === "dark"
                  ? "#202225" //  dark sidebar
                  : "#f2f3f5", // Light sidebar
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <StyledDrawer variant="permanent" open>
          {drawer}
        </StyledDrawer>
      )}

      {/* Main content area */}
      <MainContent>
        {isMobile && <Toolbar />}
        <ContentArea>{renderContent()}</ContentArea>
      </MainContent>
    </Box>
  );
}
