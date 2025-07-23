import { Snackbar, Alert } from "@mui/material";
import type { ToastMessage } from "./useToast";

interface ToastComponentProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function ToastComponent({
  toast,
  onClose,
}: ToastComponentProps) {
  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={toast?.duration || 4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={toast?.type || "info"}
        sx={{ width: "100%" }}
      >
        {toast?.message}
      </Alert>
    </Snackbar>
  );
}
