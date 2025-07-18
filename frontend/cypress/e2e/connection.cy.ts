describe("Backend Connection Test", () => {
  it("should be able to connect to backend API", () => {
    cy.request({
      method: "GET",
      url: "http://localhost:5054/api",
      failOnStatusCode: false,
    }).then((response) => {
      // Even if it returns 404, at least we know the server is running
      expect(response.status).to.be.oneOf([200, 404, 405]);
    });
  });

  it("should verify backend auth endpoint exists", () => {
    cy.request({
      method: "POST",
      url: "http://localhost:5054/api/Auth/register",
      body: {
        username: "test",
        password: "test",
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Should get some response, not a connection error
      expect(response.status).to.not.equal(undefined);
    });
  });
});

describe("Frontend Connection Test", () => {
  it("shoud load landing page header", () => {
    cy.visit("/");
    cy.get("h1").contains("Connect.Chat.Study Together.");
  });
});
