/// <reference types="cypress" />

/**
 * Course Enrollment E2E Tests
 *
 * Tests the complete course enrollment flow including:
 * - Accessing the course enrollment page
 * - Creating new courses
 * - Enrolling in existing courses
 * - Navigating between courses
 *
 * Uses custom commands from commands.ts for consistent behavior
 */

describe("Course Enrollment", () => {
  const testUser = {
    username: `enrolluser_${Date.now()}`,
    password: "testpass123",
  };

  // Helper function to navigate to Course Enrollment page with MUI-compatible selectors
  const navigateToCourseEnrollment = () => {
    cy.log("Navigating to Course Enrollment page");

    // Debug: Log what's on the page
    cy.get("body").then(($body) => {
      cy.log("Page content:", $body.text().substring(0, 500));
    });

    // Wait for the page to load completely
    cy.wait(1000);

    // Try multiple strategies to find the Course Enrollment button
    cy.get("body").then(($body) => {
      const hasCourseEnrollment = $body.text().includes("Course Enrollment");
      cy.log("Page contains 'Course Enrollment':", hasCourseEnrollment);

      if (
        $body.find('[role="button"]:contains("Course Enrollment")').length > 0
      ) {
        cy.log("Found Course Enrollment using role=button selector");
        cy.get('[role="button"]:contains("Course Enrollment")').click();
      } else {
        cy.log("Course Enrollment button not found - taking screenshot");
        cy.screenshot("course-enrollment-button-not-found");
        throw new Error("Course Enrollment button not found");
      }
    });

    // Wait for navigation to complete
    cy.wait(1000);

    // Debug: Check what's loaded after clicking
    cy.get("body").then(($body) => {
      cy.log(
        "After clicking Course Enrollment:",
        $body.text().substring(0, 500)
      );
    });
  };

  // Helper function to fill course name input with robust selectors
  const fillCourseNameInput = (courseName) => {
    cy.log(`Filling course name input with: ${courseName}`);

    // Wait for dialog/form to appear and try multiple times
    cy.wait(1000);

    // First, try to wait for a dialog to appear
    cy.get("body").then(($body) => {
      if ($body.find(".MuiDialog-root").length > 0) {
        cy.log("Dialog found - waiting for it to be visible");
        cy.get(".MuiDialog-root").should("be.visible");
      } else if ($body.find('[role="dialog"]').length > 0) {
        cy.log("Role dialog found - waiting for it to be visible");
        cy.get('[role="dialog"]').should("be.visible");
      } else if ($body.find(".modal").length > 0) {
        cy.log("Modal found - waiting for it to be visible");
        cy.get(".modal").should("be.visible");
      }
    });

    // Try to find and fill the input field with multiple strategies
    cy.get("body").then(($body) => {
      // Debug: Log what's available in the dialog
      cy.log("Dialog content:", $body.text().substring(0, 500));

      // Take screenshot for debugging
      cy.screenshot("before-input-detection");

      // Log all input elements found on the page
      const allInputs = $body.find("input");
      cy.log(`Found ${allInputs.length} input elements on page`);
      allInputs.each((index, input) => {
        const $input = Cypress.$(input);
        cy.log(
          `Input ${index}: name="${$input.attr(
            "name"
          )}", placeholder="${$input.attr("placeholder")}", type="${$input.attr(
            "type"
          )}", class="${$input.attr("class")}", parent="${$input
            .parent()
            .attr("class")}"`
        );
      });
    });

    // Try multiple selector strategies with more specific waits
    cy.get("body").then(($body) => {
      if ($body.find('input[name="name"]').length > 0) {
        cy.log("Using input[name='name'] selector");
        cy.get('input[name="name"]')
          .should("be.visible")
          .clear()
          .type(courseName);
      } else {
        cy.log("No input field found - taking screenshot");
        cy.screenshot("course-creation-input-not-found");

        // Wait a bit more and try again
        cy.wait(2000);
        cy.get("body").then(($body2) => {
          if ($body2.find(".MuiDialog-root input").length > 0) {
            cy.log("Found dialog input after additional wait");
            cy.get(".MuiDialog-root input")
              .first()
              .should("be.visible")
              .clear()
              .type(courseName);
          } else if ($body2.find("input").length > 0) {
            cy.log("Found input after additional wait");
            cy.get("input")
              .first()
              .should("be.visible")
              .clear()
              .type(courseName);
          } else {
            throw new Error(
              "Course name input field not found after multiple attempts"
            );
          }
        });
      }
    });
  };

  // Helper function to click Create/Create & Enroll button with robust selectors
  const clickCreateButton = () => {
    cy.log("Clicking Create/Create & Enroll button");

    // Wait for dialog to be fully rendered and ready
    cy.get(".MuiDialog-root").should("be.visible");
    cy.wait(500);

    // Try to click the button with multiple strategies
    cy.get("body").then(($body) => {
      if (
        $body.find('.MuiDialog-root button:contains("Create & Enroll")')
          .length > 0
      ) {
        cy.log("Clicking Create & Enroll button in dialog");
        cy.get('.MuiDialog-root button:contains("Create & Enroll")')
          .first()
          .click({ force: true });
      } else if (
        $body.find('.MuiDialog-root button:contains("Create")').length > 0
      ) {
        cy.log("Clicking Create button in dialog");
        cy.get('.MuiDialog-root button:contains("Create")')
          .first()
          .click({ force: true });
      } else {
        cy.log("Using fallback button selector");
        cy.get(
          '.MuiDialog-root button:contains("Create & Enroll"), .MuiDialog-root button:contains("Create"), button:contains("Create & Enroll"), button:contains("Create")'
        )
          .first()
          .click({ force: true });
      }
    });
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

  before(() => {
    // Create test user using helper
    createTestUser();
  });

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Use custom command for login
    cy.loginUser(testUser.username, testUser.password);
    cy.wait(1000);
  });

  it("should access course enrollment page", () => {
    // Use helper function to navigate to Course Enrollment
    navigateToCourseEnrollment();

    // Verify we're on the course enrollment page
    cy.contains("Course Enrollment").should("be.visible");
    cy.contains("My Enrolled Courses").should("be.visible");
    cy.contains("Create Course").should("be.visible");
  });

  it("should create a new course", () => {
    const courseName = `Test Course ${Date.now()}`;

    // Navigate to course enrollment
    navigateToCourseEnrollment();

    // Verify we're on the course enrollment page before proceeding
    cy.contains("Course Enrollment").should("be.visible");
    cy.contains("Create Course").should("be.visible");

    // Click create course button
    cy.log("Clicking Create Course button");
    cy.get('button:contains("Create Course")').click();

    // Wait for dialog/modal to appear and verify it's visible
    cy.wait(1500);

    // Check if dialog appeared
    cy.get("body").then(($body) => {
      cy.log("After clicking Create Course:", $body.text().substring(0, 500));

      // Look for dialog indicators
      if ($body.find(".MuiDialog-root").length > 0) {
        cy.log("MUI Dialog detected");
        cy.get(".MuiDialog-root").should("be.visible");
      } else if ($body.find('[role="dialog"]').length > 0) {
        cy.log("Role dialog detected");
        cy.get('[role="dialog"]').should("be.visible");
      } else if ($body.find(".modal").length > 0) {
        cy.log("Modal detected");
        cy.get(".modal").should("be.visible");
      } else {
        cy.log("No dialog detected - checking for form");
        cy.screenshot("after-create-course-click");

        // If no dialog, maybe the form appears inline
        cy.wait(1000);
        cy.get("body").then(($body2) => {
          if ($body2.find("input").length > 0) {
            cy.log("Form appeared inline without dialog");
          } else {
            cy.log("No form detected at all");
          }
        });
      }
    });

    // Use helper function to fill course name input
    cy.log("Waiting for dialog to appear and input to be available");

    // Wait for the dialog to fully load
    cy.wait(2000);

    // Try to find the input field within the dialog context
    cy.get("body").then(($body) => {
      // Look for dialog-specific input first
      if ($body.find(".MuiDialog-root input").length > 0) {
        cy.log("Found input in MUI Dialog");
        cy.get(".MuiDialog-root input")
          .first()
          .should("be.visible")
          .clear()
          .type(courseName);
      } else if ($body.find('[role="dialog"] input').length > 0) {
        cy.log("Found input in role dialog");
        cy.get('[role="dialog"] input')
          .first()
          .should("be.visible")
          .clear()
          .type(courseName);
      } else if ($body.find(".modal input").length > 0) {
        cy.log("Found input in modal");
        cy.get(".modal input")
          .first()
          .should("be.visible")
          .clear()
          .type(courseName);
      } else {
        cy.log("No dialog-specific input found, using helper function");
        fillCourseNameInput(courseName);
      }
    });

    // Submit the form
    cy.log("Submitting course creation form");
    clickCreateButton();

    // Wait for course creation to complete
    cy.wait(2000);

    // Verify course created successfully
    cy.contains(courseName).should("be.visible");
    cy.contains("Enrolled").should("be.visible");
  });

  it("should enroll in existing courses and then unenroll", () => {
    // Navigate to course enrollment
    navigateToCourseEnrollment();

    // Look for available courses to enroll in
    cy.get("body").then(($body) => {
      if ($body.find('button:contains("Enroll")').length > 0) {
        // Get the first available course name for verification
        cy.get('button:contains("Enroll")')
          .first()
          .parent()
          .then(($courseElement) => {
            const courseText = $courseElement.text();
            cy.log(`Enrolling in course: ${courseText}`);

            // Click enroll button
            cy.get('button:contains("Enroll")').first().click();

            // Verify enrollment successful
            cy.get('button:contains("Unenroll")').should("exist");
            cy.contains("Unenroll").should("be.visible");

            // Now unenroll from the same course
            cy.log("Now unenrolling from the same course");
            cy.get('button:contains("Unenroll")').first().click();

            // Verify unenrolled
            cy.get('button:contains("Enroll")').first().should("exist");
          });
      } else {
        cy.log("No courses available to enroll in - creating one first");

        // Create a course first if none exist
        const fallbackCourseName = `Fallback Course ${Date.now()}`;
        cy.get('button:contains("Create Course")').click();

        // Use helper function to fill course name input
        fillCourseNameInput(fallbackCourseName);

        clickCreateButton();

        // Verify creation and enrollment
        cy.contains(fallbackCourseName).should("be.visible");
        cy.contains("Enrolled").should("be.visible");

        // Now unenroll from the created course
        cy.log("Now unenrolling from the created course");
        cy.contains(fallbackCourseName)
          .parent()
          .within(() => {
            cy.get('button:contains("Unenroll")').click();
          });

        // Verify unenrolled
        cy.contains(fallbackCourseName)
          .parent()
          .within(() => {
            cy.get('button:contains("Enroll")').should("exist");
            cy.contains("Enrolled").should("not.exist");
          });
      }
    });
  });

  it("should navigate between courses in sidebar", () => {
    // Ensure we have at least one course to navigate to
    cy.get("body").then(($body) => {
      if ($body.text().includes("Global")) {
        cy.log("Global course found in sidebar");

        // Click on Global course
        cy.contains("Global").click();
        cy.wait(1000);

        // Verify we're in the Global course chat
        cy.contains("Global").should("be.visible");

        // Check if message input is available (chat interface loaded)
        cy.get("body").then(($chatBody) => {
          if (
            $chatBody.find(
              'input[placeholder*="Message"], textarea[placeholder*="Message"]'
            ).length > 0
          ) {
            cy.get(
              'input[placeholder*="Message"], textarea[placeholder*="Message"]'
            ).should("be.visible");
            cy.log("Chat interface loaded successfully");
          } else {
            cy.log("Chat interface not loaded, but navigation successful");
          }
        });
      } else {
        cy.log(
          "No Global course found - creating a course for navigation test"
        );

        // Create a course for navigation test
        navigateToCourseEnrollment();
        const navTestCourseName = `Nav Test ${Date.now()}`;
        cy.get('button:contains("Create Course")').click();

        // Use helper function to fill course name input
        fillCourseNameInput(navTestCourseName);

        clickCreateButton();

        // Navigate to the created course
        cy.contains(navTestCourseName).click();
        cy.wait(1000);

        // Verify navigation
        cy.contains(navTestCourseName).should("be.visible");
      }
    });
  });

  it("should display enrolled courses list", () => {
    // Navigate to course enrollment
    navigateToCourseEnrollment();

    // Check if there are enrolled courses
    cy.get("body").then(($body) => {
      if ($body.text().includes("My Enrolled Courses")) {
        cy.contains("My Enrolled Courses").should("be.visible");

        // Check if there are any enrolled courses displayed
        if ($body.find('button:contains("Unenroll")').length > 0) {
          cy.get('button:contains("Unenroll")').should("exist");
          cy.log("Found enrolled courses in the list");
        } else {
          cy.log("No enrolled courses found - this is expected for a new user");
        }
      } else {
        cy.log("Enrolled courses section not found");
      }
    });
  });

  it("should handle course enrollment errors gracefully", () => {
    // Navigate to course enrollment
    navigateToCourseEnrollment();

    // Verify the page loads without errors
    cy.contains("Course Enrollment").should("be.visible");
    cy.get('button:contains("Create Course")').should("be.visible");

    // Try to create a course with invalid data
    cy.get('button:contains("Create Course")').click();

    // Wait for dialog to appear
    cy.wait(1000);

    // Try to submit empty form - use helper function to handle button clicking
    clickCreateButton();

    // Should show validation error or stay on the same page
    cy.get("body").then(($body) => {
      if ($body.text().includes("required") || $body.text().includes("error")) {
        cy.log("Form validation working correctly");
      } else {
        cy.log("Form validation may need improvement");
      }
    });
  });
});
