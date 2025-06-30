import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { checkAuth } from "../auth/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
}
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check authentication status when component mounts
    dispatch(checkAuth());
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
