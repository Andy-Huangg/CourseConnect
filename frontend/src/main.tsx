import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App.tsx";
import Signup from "./auth/Signup.tsx";
import Login from "./auth/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Get auth state from Redux instead of checking localStorage
  const { isAuthenticated } = store.getState().auth;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
]);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element not found. Make sure there is a div with id='root' in your HTML."
  );
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
