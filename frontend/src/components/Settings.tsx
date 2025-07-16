import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Avatar,
  Divider,
} from "@mui/material";
import { Person, Edit } from "@mui/icons-material";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { updateDisplayName } from "../auth/authSlice";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Get current user info from token
  const getCurrentUserInfo = () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        username: payload.sub || "",
        displayName: payload.displayName || payload.sub || "",
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (open) {
      const userInfo = getCurrentUserInfo();
      if (userInfo) {
        setDisplayName(userInfo.displayName);
        setOriginalDisplayName(userInfo.displayName);
      }
      setUpdateSuccess(false);
      setIsEditing(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (displayName.trim() === originalDisplayName) {
      setIsEditing(false);
      return;
    }

    const result = await dispatch(updateDisplayName(displayName.trim()));
    if (updateDisplayName.fulfilled.match(result)) {
      setOriginalDisplayName(displayName.trim());
      setIsEditing(false);
      setUpdateSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
  };

  const handleCancel = () => {
    setDisplayName(originalDisplayName);
    setIsEditing(false);
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  const userInfo = getCurrentUserInfo();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <Person />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">
            Account Settings
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Display name updated successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Username
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            @{userInfo?.username || user}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Your username cannot be changed
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Display Name
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isEditing ? (
              <TextField
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                helperText="This is how others will see your name in chats"
                autoFocus
                inputProps={{ maxLength: 50 }}
                sx={{ flex: 1 }}
              />
            ) : (
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  {originalDisplayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This is how others see your name in chats
                </Typography>
              </Box>
            )}
            {!isEditing && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
                sx={{ ml: 1 }}
              >
                Edit
              </Button>
            )}
          </Box>

          {isEditing && (
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isLoading || !displayName.trim()}
                sx={{ minWidth: 80 }}
              >
                {isLoading ? <CircularProgress size={20} /> : "Save"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
