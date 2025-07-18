import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // Vite dev server (updated port)
    setupNodeEvents(on, config) {
      // implement node event listeners if needed
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
    env: {
      VITE_API_URL: "https://localhost:7152", // Your backend HTTPS API URL
    },
    // Increase timeouts for better reliability
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    // Handle Chrome security issues with localhost HTTPS
    chromeWebSecurity: false,
    // Additional options for HTTPS localhost
    modifyObstructiveCode: false,
  },
});
