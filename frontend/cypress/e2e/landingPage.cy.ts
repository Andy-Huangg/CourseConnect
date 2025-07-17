describe("landing page", () => {
  it("passes", () => {
    cy.visit("http://localhost:5173");
    cy.get("h1").contains("Connect.Chat.Study Together.");
  });
});
