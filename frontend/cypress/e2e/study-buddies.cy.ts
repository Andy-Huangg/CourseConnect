describe("Study Buddies - Simple Test", () => {
  const testUser = {
    username: `buddy_${Date.now()}`,
    password: "testpass123",
  };

  before(() => {
    // Create test user
    cy.request({
      method: "POST",
      url: `${
        Cypress.env("VITE_API_URL") || "http://localhost:5000"
      }/api/Auth/register`,
      body: testUser,
      failOnStatusCode: false,
    });
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Login
    cy.visit("/login");
    cy.get('input[autocomplete="username"]').type(testUser.username);
    cy.get('input[autocomplete="current-password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/home");

    // Wait for page to load completely
    cy.wait(2000);
  });

  it("should navigate to study buddies section", () => {
    // Find and click the Study Buddies navigation item
    cy.get('[role="button"]').contains("Study Buddies").click();

    // Verify we're in the study buddies section
    cy.contains("Study Buddies", { timeout: 10000 }).should("be.visible");
    cy.contains("Connect with classmates", { timeout: 5000 }).should(
      "be.visible"
    );
  });

  it("should display study buddy interface elements", () => {
    // Navigate to Study Buddies
    cy.get('[role="button"]').contains("Study Buddies").click();

    // Wait for content to load
    cy.contains("Study Buddies", { timeout: 10000 }).should("be.visible");

    // Check for key interface elements based on user's course enrollment status
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Find Study Buddy")').length > 0) {
        // User has courses and can find study buddies
        cy.contains("Find Study Buddy").should("be.visible");
      } else if (
        $body.find(':contains("You need to enroll in courses first")').length >
        0
      ) {
        // User needs to enroll in courses first
        cy.contains("You need to enroll in courses first").should("be.visible");
      }
    });
  });

  it("should handle study buddy opt-in flow", () => {
    // Navigate to Study Buddies
    cy.get('[role="button"]').contains("Study Buddies").click();
    cy.contains("Study Buddies", { timeout: 10000 }).should("be.visible");

    // Look for Find Study Buddy button (only if user is enrolled in courses)
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Find Study Buddy")').length > 0) {
        // Click Find Study Buddy
        cy.contains("Find Study Buddy").first().click();

        // Should open the opt-in dialog
        cy.contains("Join Study Buddy Program", { timeout: 5000 }).should(
          "be.visible"
        );

        // Add optional contact preference
        cy.get('textarea[placeholder*="Discord"]').type(
          "Discord: testuser#1234"
        );

        // Join the program
        cy.contains("button", "Join Program").click();

        // Should close dialog and show confirmation
        cy.contains("Join Study Buddy Program", { timeout: 5000 }).should(
          "not.exist"
        );

        // Should show either waiting status or study buddy found status
        cy.get("body").then(($body) => {
          if ($body.find(':contains("Study Buddy Found!")').length > 0) {
            // If a study buddy was immediately found
            cy.contains("Study Buddy Found!", { timeout: 10000 }).should(
              "be.visible"
            );
            cy.contains("Chat").should("be.visible");
          } else {
            // If still waiting for a match
            cy.contains("Looking for study buddy", { timeout: 10000 }).should(
              "be.visible"
            );
          }
        });
      } else {
        cy.log("User is not enrolled in courses, skipping opt-in test");
      }
    });
  });

  it("should show appropriate messaging for different states", () => {
    // Navigate to Study Buddies
    cy.get('[role="button"]').contains("Study Buddies").click();
    cy.contains("Study Buddies", { timeout: 10000 }).should("be.visible");

    // Test different possible states
    cy.get("body").then(($body) => {
      // Check for no courses enrolled state
      if (
        $body.find(':contains("You need to enroll in courses first")').length >
        0
      ) {
        cy.contains("You need to enroll in courses first").should("be.visible");
        cy.contains("My Courses").should("be.visible"); // Reference to course enrollment
      }

      // Check for waiting for match state (opted in but no buddy found)
      if ($body.find(':contains("Looking for study buddy")').length > 0) {
        cy.contains("Looking for study buddy").should("be.visible");
        cy.contains("Waiting for a study buddy match").should("be.visible");
        cy.contains("Opt Out").should("be.visible");
      }

      // Check for matched state
      if ($body.find(':contains("Study Buddy Found!")').length > 0) {
        cy.contains("Study Buddy Found!").should("be.visible");
        cy.contains("Chat").should("be.visible");
        cy.contains("Remove Connection").should("be.visible");
      }
    });
  });

  it("should allow navigation between sections", () => {
    // Start in Study Buddies
    cy.get('[role="button"]').contains("Study Buddies").click();
    cy.contains("Study Buddies", { timeout: 10000 }).should("be.visible");

    // Navigate to Course Overview
    cy.get('[role="button"]').contains("Course Overview").click();
    cy.contains("Course Overview", { timeout: 5000 }).should("be.visible");

    // Navigate back to Study Buddies
    cy.get('[role="button"]').contains("Study Buddies").click();
    cy.contains("Study Buddies", { timeout: 5000 }).should("be.visible");

    // Try Course Enrollment if available
    cy.get("body").then(($body) => {
      if ($body.find(':contains("Course Enrollment")').length > 0) {
        cy.get('[role="button"]').contains("Course Enrollment").click();
        cy.contains("Course Enrollment", { timeout: 5000 }).should(
          "be.visible"
        );
      }
    });
  });
});
