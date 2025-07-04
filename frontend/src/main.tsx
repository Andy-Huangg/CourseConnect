import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { ThemeProvider } from "./theme/ThemeProvider";
import { CourseProvider } from "./context/CourseContext";
import App from "./App.tsx";
import Signup from "./auth/Signup.tsx";
import Login from "./auth/Login.tsx";
import Home from "./pages/Home.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

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
    path: "/home",
    element: (
      <ProtectedRoute>
        <Home />
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
      <ThemeProvider>
        <CourseProvider>
          <RouterProvider router={router} />
        </CourseProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
