import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // change if needed
    setupNodeEvents(on, config) {
      // implement node event listeners if needed
    },
  },
});
