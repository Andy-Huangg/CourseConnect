import { useState } from "react";
import {
  Box,
  TextField,
  Paper,
  Switch,
  FormControlLabel,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import EmojiPicker, { EmojiPickerTrigger } from "../../ui/EmojiPicker";
import type { MessageInputProps } from "../types";

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  flexShrink: 0,
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(1.5, 1),
    paddingBottom: theme.spacing(1.5),
  },
}));

const InputPaper = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-end",
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.mode === "dark" ? "#40444b" : "#ebedef",
  borderRadius: theme.spacing(2),
  gap: theme.spacing(0.5),
  position: "relative",
  zIndex: 1, // Ensure input is clickable
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(0.5, 0.75),
    alignItems: "center", // Better alignment on mobile
    gap: theme.spacing(0.25),
  },
}));

export default function MessageInput({
  input,
  onInputChange,
  onSendMessage,
  onKeyPress,
  placeholder,
  buddy,
  isAnonymous = false,
  anonymousName = "",
  onAnonymousModeChange,
}: MessageInputProps) {
  const theme = useTheme();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onInputChange(input + emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyPressInternal = (e: React.KeyboardEvent) => {
    // Close emoji picker on any key press
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
    onKeyPress(e);
  };

  const handleInputFocus = () => {
    // Close emoji picker when input is focused
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  return (
    <InputContainer>
      {/* Anonymous mode toggle for course chat */}
      {!buddy && onAnonymousModeChange && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 0.5, md: 1 },
            py: 0.5,
            mb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexWrap: { xs: "wrap", sm: "nowrap" },
            gap: 1,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isAnonymous}
                onChange={(e) => onAnonymousModeChange(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
              >
                Anonymous Mode
              </Typography>
            }
            sx={{ m: 0 }}
          />
          {isAnonymous && anonymousName && (
            <Chip
              label={`🎭 ${anonymousName}`}
              size="small"
              color="warning"
              sx={{ fontSize: "0.7rem", height: 24 }}
            />
          )}
        </Box>
      )}

      {/* Message input */}
      <InputPaper>
        <TextField
          fullWidth
          variant="standard"
          placeholder={placeholder}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyPressInternal}
          onFocus={handleInputFocus}
          disabled={false} // Never disable the input field itself
          multiline
          maxRows={3}
          InputProps={{
            disableUnderline: true,
            sx: {
              px: { xs: 0.25, md: 1 },
              py: { xs: 0.25, md: 0.5 },
              fontSize: { xs: "0.875rem", md: "1rem" },
              lineHeight: { xs: 1.4, md: 1.5 },
              minHeight: { xs: "32px", md: "36px" },
              display: "flex",
              alignItems: "center",
            },
            autoComplete: "off",
          }}
          sx={{
            "& .MuiInputBase-input": {
              resize: "none",
              minHeight: { xs: "18px", md: "20px" },
              lineHeight: { xs: 1.4, md: 1.5 },
              padding: "0 !important", // Override default padding
            },
            "& .MuiInputBase-root": {
              alignItems: "center",
            },
          }}
        />

        {/* Emoji picker trigger */}
        <EmojiPickerTrigger
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={false} // Never disable emoji picker
        />

        {/* Send button */}
        <IconButton
          size="small"
          onClick={onSendMessage}
          disabled={!input.trim()} // Only disable if no input text
          sx={{
            minWidth: { xs: "32px", md: "36px" },
            minHeight: { xs: "32px", md: "36px" },
            padding: { xs: "6px", md: "8px" },
            "&:not(:disabled)": {
              color: theme.palette.primary.main,
            },
          }}
        >
          <SendIcon sx={{ fontSize: { xs: "18px", md: "20px" } }} />
        </IconButton>

        {/* Emoji picker */}
        <EmojiPicker
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
        />
      </InputPaper>
    </InputContainer>
  );
}
