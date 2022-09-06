/// <reference types="cypress" />

describe("check that the app redirects to /unauthorized when tenant is not set", () => {
  it("redirects to unauthorized when visiting orders page", () => {
    cy.visit(Cypress.env("host") + "/orders");
    cy.location().should((loc) => {
      expect(loc.href).to.contain("/unauthorized");
      expect(loc.href).to.not.contain("/orders");
    });
  });

  it("redirects to unauthorized when visiting products page", () => {
    cy.visit(Cypress.env("host") + "/products");
    cy.location().should((loc) => {
      expect(loc.href).to.contain("/unauthorized");
      expect(loc.href).to.not.contain("/products");
    });
  });

  it("redirects to unauthorized when visiting a random page", () => {
    cy.visit(Cypress.env("host") + "/random");
    cy.location().should((loc) => {
      expect(loc.href).to.contain("/unauthorized");
      expect(loc.href).to.not.contain("/random");
    });
  });
});

describe("check that the app redirects to a page with a sign-in form when tenant is set and user is not logged in", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("host"));

    cy.get("#tenantname").should("exist");
    cy.get("#tenantname").type(Cypress.env("tenantName"));

    cy.intercept({
      method: "GET",
      url: "**/tenant/init/*",
    }).as("getTenantInfo");

    cy.contains("Submit").click();
    cy.wait("@getTenantInfo");

    cy.location("href").should("contain", "/dashboard");
  });

  it("redirects when visiting orders page", () => {
    cy.visit(Cypress.env("host") + "/orders");
    cy.location().should((loc) => {
      expect(loc.href).to.not.contain("/unauthorized");
      expect(loc.href).to.not.contain("/orders");
    });

    cy.get("form").within(() => {
      cy.get('input[name="username"]').should("exist");
      cy.get('input[name="password"]').should("exist");
    });
  });

  it("redirects when visiting products page", () => {
    cy.visit(Cypress.env("host") + "/products");
    cy.location().should((loc) => {
      expect(loc.href).to.not.contain("/unauthorized");
      expect(loc.href).to.not.contain("/products");
    });

    cy.get("form").within(() => {
      cy.get('input[name="username"]').should("exist");
      cy.get('input[name="password"]').should("exist");
    });
  });

  it("redirects when visiting a random page", () => {
    cy.visit(Cypress.env("host") + "/random");
    cy.location().should((loc) => {
      expect(loc.href).to.not.contain("/unauthorized");
      expect(loc.href).to.not.contain("/random");
    });

    cy.get("form").within(() => {
      cy.get('input[name="username"]').should("exist");
      cy.get('input[name="password"]').should("exist");
    });
  });
});

describe("check that login/logout functionality works as expected", () => {
  beforeEach(() => {
    cy.visit(Cypress.env("host"));

    cy.get("#tenantname").type(Cypress.env("tenantName"));

    cy.intercept({
      method: "GET",
      url: "**/tenant/init/*",
    }).as("getTenantInfo");

    cy.contains("Submit").click();
    cy.wait("@getTenantInfo");

    cy.get('form input[name="username"]').type(Cypress.env("tenantUsername"));
    cy.get('form input[name="password"]').type(
      Cypress.env("tenantUserPassword")
    );
    cy.get('form button[type="submit"]').click();
    cy.wait(1500);

    cy.get("body").then((body) => {
      if (body.find('form input[name="confirm_password"]').length > 0) {
        cy.get('form input[name="password"]').type(
          Cypress.env("tenantUserPassword")
        );
        cy.get('form input[name="confirm_password"]').type(
          Cypress.env("tenantUserPassword")
        );
        cy.get('form button[type="submit"]').click();
      }
    });

    cy.location().should((loc) => {
      expect(loc.href).to.contain("/dashboard");
      expect(loc.href).to.not.contain("/unauthorized");
    });

    cy.get("h1").contains("Dashboard").should;
  });

  it("can access dashboard page after logging in", () => {
    cy.location().should((loc) => {
      expect(loc.href).to.contain("/dashboard");
      expect(loc.href).to.not.contain("/unauthorized");
    });

    cy.get("h1").contains("Dashboard").should("be.visible");
  });

  it("can log out and go to unauthorized page instead of login page", () => {
    cy.get("button").contains("person").click();
    cy.get("button").contains("Sign Out").click();
    cy.get("#tenantname").should("exist");
    cy.get('form input[name="username"]').should("not.exist");
    cy.get('form input[name="password"]').should("not.exist");

    cy.location().should((loc) => {
      expect(loc.href).to.contain("/unauthorized");
      expect(loc.href).to.not.contain("/dashboard");
    });
  });

  it("can't access dashboard after logging out", () => {
    cy.get("button").contains("person").click();
    cy.get("button").contains("Sign Out").click();
    cy.get("#tenantname").should("exist");
    cy.get('form input[name="username"]').should("not.exist");
    cy.get('form input[name="password"]').should("not.exist");

    cy.location().should((loc) => {
      expect(loc.href).to.contain("/unauthorized");
      expect(loc.href).to.not.contain("/dashboard");
    });

    cy.visit(Cypress.env("host") + "/dashboard");
    cy.location().should((loc) => {
      expect(loc.href).to.contain("/unauthorized");
      expect(loc.href).to.not.contain("/dashboard");
    });
    cy.get('form input[name="username"]').should("not.exist");
    cy.get('form input[name="password"]').should("not.exist");
  });
});
