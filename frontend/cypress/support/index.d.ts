/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login a user
     * @example cy.loginUser('username', 'password')
     */
    loginUser(username: string, password: string): Chainable<void>;

    /**
     * Custom command to signup a user
     * @example cy.signupUser('username', 'password')
     */
    signupUser(username: string, password: string): Chainable<void>;

    /**
     * Custom command to navigate to a section
     * @example cy.navigateToSection('Chat')
     */
    navigateToSection(section: string): Chainable<void>;

    /**
     * Custom command to enroll in a course
     * @example cy.enrollInCourse('Global')
     */
    enrollInCourse(courseName: string): Chainable<void>;

    /**
     * Custom command to send a message
     * @example cy.sendMessage('Hello world')
     */
    sendMessage(message: string): Chainable<void>;

    /**
     * Custom command to wait for chat connection
     * @example cy.waitForChatConnection()
     */
    waitForChatConnection(): Chainable<void>;
  }
}
