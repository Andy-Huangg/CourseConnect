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
import { Person, Edit, DeleteForever, Warning } from "@mui/icons-material";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { updateDisplayName, logout } from "../auth/authSlice";
import { useNavigate } from "react-router-dom";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setDeleteError("");
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setDeleteError("No authentication token found");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/user/account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }

      // Account deleted successfully - log out and redirect
      dispatch(logout());
      navigate("/");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setIsDeleting(false);
    }
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

        <Divider sx={{ my: 3 }} />

        {/* Danger Zone */}
        <Box>
          <Typography
            variant="subtitle2"
            color="error.main"
            gutterBottom
            fontWeight="bold"
          >
            Danger Zone
          </Typography>

          {showDeleteConfirm ? (
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: "error.main",
                borderRadius: 1,
                backgroundColor: "error.light",
                color: "error.contrastText",
              }}
            >
              <Typography variant="body2" gutterBottom>
                <Warning sx={{ verticalAlign: "middle", mr: 1 }} />
                This action cannot be undone. This will permanently delete your
                account and all associated data.
              </Typography>

              <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                To confirm, type "<strong>DELETE</strong>" in the box below:
              </Typography>

              <TextField
                fullWidth
                value={deleteConfirmText}
                onChange={(e) =>
                  setDeleteConfirmText(e.target.value.toUpperCase())
                }
                placeholder="Type DELETE to confirm"
                variant="outlined"
                size="small"
                sx={{ mb: 2, backgroundColor: "background.paper" }}
              />

              {deleteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {deleteError}
                </Alert>
              )}

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  startIcon={
                    isDeleting ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DeleteForever />
                    )
                  }
                  size="small"
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  disabled={isDeleting}
                  size="small"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Once you delete your account, there is no going back. All your
                data including courses, messages, and study buddy connections
                will be permanently removed.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteConfirm(true)}
                startIcon={<DeleteForever />}
                size="small"
              >
                Delete Account
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined" disabled={isDeleting}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
