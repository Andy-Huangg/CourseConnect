import { useState } from "react";
import { Box, Typography, Button, Paper, Tabs, Tab } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../auth/authSlice";
import ThemeToggle from "../components/ThemeToggle";
import Chat from "../components/Chat";
import CourseEnrollment from "../components/CourseEnrollment";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);

  const handleSignOut = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Paper sx={{ p: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Welcome back, {user}!</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <ThemeToggle />
            <Button variant="outlined" color="primary" onClick={handleSignOut}>
              Sign Out
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="basic tabs example"
          >
            <Tab label="My Courses" {...a11yProps(0)} />
            <Tab label="Chat" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CourseEnrollment />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Chat wsBase={import.meta.env.VITE_WS_URL} />
        </TabPanel>
      </Paper>
    </Box>
  );
}
