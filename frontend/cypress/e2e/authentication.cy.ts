/// <reference types="cypress" />
describe("Authentication Flow", () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "testpass123",
  };

  // Helper function to create user via API
  const createTestUser = (user = testUser) => {
    cy.request({
      method: "POST",
      url: `${
        Cypress.env("VITE_API_URL") || "http://localhost:5000"
      }/api/Auth/register`,
      body: {
        username: user.username,
        password: user.password,
      },
      failOnStatusCode: false,
    });
  };

  beforeEach(() => {
    // Clear any existing authentication
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe("Signup Process", () => {
    it("should display signup form correctly", () => {
      cy.visit("/signup");

      // Check page elements
      cy.contains("CourseConnect").should("be.visible");
      cy.contains("Sign Up").should("be.visible");
      cy.contains("Create your account to connect with course mates").should(
        "be.visible"
      );

      // Check form fields - Material UI TextFields have different structure
      cy.get('input[autocomplete="username"]').should("be.visible");
      cy.get('input[autocomplete="new-password"]').should("be.visible");
      cy.get('button[type="submit"]')
        .should("be.visible")
        .and("contain", "Create Account");

      // Check navigation links
      cy.contains("Sign in here").should("be.visible");
      cy.contains("Back to Home").should("be.visible");
    });

    it("should validate form inputs", () => {
      cy.visit("/signup");

      // Test empty form submission - button should be disabled
      cy.get('button[type="submit"]').should("be.disabled");

      // Test username validation
      cy.get('input[autocomplete="username"]').type("ab");
      cy.get('input[autocomplete="username"]').blur();
      cy.contains("Username must be at least 3 characters long").should(
        "be.visible"
      );

      // Test password validation
      cy.get('input[autocomplete="new-password"]').type("123");
      cy.get('input[autocomplete="new-password"]').blur();
      cy.contains("Password must be at least 4 characters long").should(
        "be.visible"
      );

      // Button should still be disabled
      cy.get('button[type="submit"]').should("be.disabled");
    });

    it("should successfully create a new account", () => {
      cy.visit("/signup");

      // Use custom command from commands.ts
      cy.signupUser(testUser.username, testUser.password);

      // Should redirect to home page and be authenticated
      cy.url().should("include", "/home");
      cy.window().its("localStorage").invoke("getItem", "jwt").should("exist");

      // Should show dashboard
      cy.contains("CourseConnect").should("be.visible");
      cy.contains("Course Overview").should("be.visible");
    });

    it("should prevent duplicate username signup", () => {
      // Create user first to ensure it exists
      createTestUser();

      // Try to signup with same username
      cy.visit("/signup");
      cy.get('input[autocomplete="username"]').type(testUser.username);
      cy.get('input[autocomplete="new-password"]').type("differentpass");
      cy.get('button[type="submit"]').click();

      // Should show error
      cy.contains("Username already exists").should("be.visible");
      cy.url().should("include", "/signup");
    });
  });

  describe("Login Process", () => {
    beforeEach(() => {
      // Create a test user first using helper
      createTestUser();
    });

    it("should display login form correctly", () => {
      cy.visit("/login");

      // Check page elements
      cy.contains("CourseConnect").should("be.visible");
      cy.contains("Welcome Back").should("be.visible");
      cy.contains("Sign in to connect with your course mates").should(
        "be.visible"
      );

      // Check form fields
      cy.get('input[autocomplete="username"]').should("be.visible");
      cy.get('input[autocomplete="current-password"]').should("be.visible");
      cy.get('button[type="submit"]')
        .should("be.visible")
        .and("contain", "Sign In");

      // Check navigation links
      cy.contains("Sign up here").should("be.visible");
      cy.contains("Back to Home").should("be.visible");
    });

    it("should successfully login with valid credentials", () => {
      // Use custom command from commands.ts
      cy.loginUser(testUser.username, testUser.password);

      // Should redirect to home and be authenticated
      cy.url().should("include", "/home");
      cy.window().its("localStorage").invoke("getItem", "jwt").should("exist");

      // Should show dashboard
      cy.contains("CourseConnect").should("be.visible");
    });

    it("should reject invalid credentials", () => {
      cy.visit("/login");

      // Try with wrong password
      cy.get('input[autocomplete="username"]').type(testUser.username);
      cy.get('input[autocomplete="current-password"]').type("wrongpassword");
      cy.get('button[type="submit"]').click();

      // Should show error
      cy.contains("Invalid username or password").should("be.visible");
      cy.url().should("include", "/login");

      // Should not have JWT token
      cy.window()
        .its("localStorage")
        .invoke("getItem", "jwt")
        .should("not.exist");
    });

    it("should reject non-existent user", () => {
      cy.visit("/login");

      cy.get('input[autocomplete="username"]').type("nonexistentuser");
      cy.get('input[autocomplete="current-password"]').type("somepassword");
      cy.get('button[type="submit"]').click();

      cy.contains("Invalid username or password").should("be.visible");
      cy.url().should("include", "/login");
    });
  });

  describe("Authentication State", () => {
    it("should redirect authenticated users from auth pages", () => {
      // Login using custom command
      cy.loginUser(testUser.username, testUser.password);

      // Try to visit login page
      cy.visit("/login");
      cy.url().should("include", "/home");

      // Try to visit signup page
      cy.visit("/signup");
      cy.url().should("include", "/home");
    });

    it("should redirect unauthenticated users to login", () => {
      // Try to visit protected route
      cy.visit("/home");
      cy.url().should("include", "/login");
    });

    it("should handle logout correctly", () => {
      // Login using custom command
      cy.loginUser(testUser.username, testUser.password);

      // Logout
      cy.get(
        'button[aria-label*="Sign out"], button:contains("Sign out")'
      ).click();

      // Should redirect to login
      cy.url().should("not.include", "/home");

      // Should not have JWT token
      cy.window()
        .its("localStorage")
        .invoke("getItem", "jwt")
        .should("not.exist");
    });

    it("should persist authentication across page refreshes", () => {
      // Login using custom command
      cy.loginUser(testUser.username, testUser.password);

      // Refresh page
      cy.reload();

      // Should still be authenticated
      cy.url().should("include", "/home");
      cy.window().its("localStorage").invoke("getItem", "jwt").should("exist");
    });
  });

  describe("Navigation Links", () => {
    it("should navigate between auth pages correctly", () => {
      // Start at signup
      cy.visit("/signup");

      // Go to login
      cy.contains("Sign in here").click();
      cy.url().should("include", "/login");

      // Go back to signup
      cy.contains("Sign up here").click();
      cy.url().should("include", "/signup");

      // Go to home
      cy.contains("Back to Home").click();
      cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("should show different navigation when authenticated", () => {
      // Check unauthenticated state
      cy.visit("/");
      cy.contains("Login").should("be.visible");
      cy.contains("Sign Up").should("be.visible");
      cy.contains("Dashboard").should("not.exist");

      // Login using custom command
      cy.loginUser(testUser.username, testUser.password);

      // Wait for authentication state to be properly set
      cy.window().its("localStorage").invoke("getItem", "jwt").should("exist");

      // Go back to home page
      cy.visit("/");

      // Wait for the authenticated navigation to appear
      cy.contains("Dashboard", { timeout: 10000 }).should("be.visible");
      cy.contains("Login").should("not.exist");
      cy.contains("Sign Up").should("not.exist");
    });
  });
});
