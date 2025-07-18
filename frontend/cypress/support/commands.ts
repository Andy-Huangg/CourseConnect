/// <reference types="cypress" />

// Custom commands for CourseConnect testing

// Authentication helpers
function loginUser(username: string, password: string) {
  cy.visit("/login");
  cy.get('input[autocomplete="username"]').type(username);
  cy.get('input[autocomplete="current-password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/home");
  cy.window().its("localStorage").invoke("getItem", "jwt").should("exist");
}

function signupUser(username: string, password: string) {
  cy.visit("/signup");
  cy.get('input[autocomplete="username"]').type(username);
  cy.get('input[autocomplete="new-password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/home");
  cy.window().its("localStorage").invoke("getItem", "jwt").should("exist");
}

// Navigation helpers
function navigateToSection(section: string) {
  cy.get(`button:contains("${section}")`).click();
}

// Course helpers
function enrollInCourse(courseName: string) {
  cy.get('button:contains("Course Enrollment")').click();
  cy.get('input[placeholder*="Search"]').type(courseName);
  cy.get(`button:contains("Enroll")`).first().click();
  cy.get('button:contains("Unenroll")').should("exist");
}

// Chat helpers
function sendMessage(message: string) {
  cy.get(
    'input[placeholder*="Message"], textarea[placeholder*="Message"]'
  ).type(`${message}{enter}`);
}

function waitForChatConnection() {
  cy.get('.chat-connected, [data-testid="chat-connected"]', {
    timeout: 10000,
  }).should("exist");
}

// Export functions to window for global access
Cypress.Commands.addAll({
  loginUser,
  signupUser,
  navigateToSection,
  enrollInCourse,
  sendMessage,
  waitForChatConnection,
});
