import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

interface EditMessageDialogProps {
  open: boolean;
  messageId: number | null;
  initialContent: string;
  onClose: () => void;
  onSave: (messageId: number, content: string) => Promise<void>;
}

export default function EditMessageDialog({
  open,
  messageId,
  initialContent,
  onClose,
  onSave,
}: EditMessageDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  // Update content when dialog opens with new message
  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSave = async () => {
    if (!messageId || !content.trim()) return;

    setIsSaving(true);
    try {
      await onSave(messageId, content.trim());
      onClose();
    } catch (error) {
      console.error("Failed to save message:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

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
      <DialogTitle>Edit Message</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your message..."
          sx={{
            mt: 1,
            "& .MuiInputBase-root": {
              borderRadius: 1,
            },
          }}
          disabled={isSaving}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={isSaving}
          sx={{ borderRadius: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!content.trim() || isSaving}
          sx={{ borderRadius: 1 }}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
