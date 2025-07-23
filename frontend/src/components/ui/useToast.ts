import { useState, useCallback } from "react";

export interface ToastMessage {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

// Simple toast hook
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((toastMessage: ToastMessage) => {
    setToast(toastMessage);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
