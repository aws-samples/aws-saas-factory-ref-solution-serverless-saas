/// <reference types="cypress" />

describe('check that the app redirects to /unauthorized when tenant is not set', () => {
  it('redirects to unauthorized when visiting orders page', () => {
    cy.visit(Cypress.env('host') + '/orders')
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/unauthorized')
      expect(loc.href).to.not.contain('/orders')
    });
  })

  it('redirects to unauthorized when visiting products page', () => {
    cy.visit(Cypress.env('host') + '/products')
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/unauthorized')
      expect(loc.href).to.not.contain('/products')
    });
  })

  it('redirects to unauthorized when visiting a random page', () => {
    cy.visit(Cypress.env('host') + '/random')
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/unauthorized')
      expect(loc.href).to.not.contain('/random')
    });
  })
})

describe('check that the app redirects to a page with a sign-in form when tenant is set and user is not logged in', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('host'))

    cy.get('#tenantname').should('exist')
    cy.get('#tenantname').type(Cypress.env('tenantId'))

    cy.intercept({
      method: 'GET',
      url: '**/tenant/init/*',
    }).as('getTenantInfo')

    cy.contains('Submit').click()
    cy.wait('@getTenantInfo')

    cy.location('href').should('contain', '/dashboard')
  })

  it('redirects when visiting orders page', () => {
    cy.visit(Cypress.env('host') + '/orders')
    cy.location().should((loc) => {
      expect(loc.href).to.not.contain('/unauthorized')
      expect(loc.href).to.not.contain('/orders')
    });

    cy.get('form').within(() => {
      cy.get('input[name="username"]').should('exist');
      cy.get('input[name="password"]').should('exist');
    })
  })

  it('redirects when visiting products page', () => {
    cy.visit(Cypress.env('host') + '/products')
    cy.location().should((loc) => {
      expect(loc.href).to.not.contain('/unauthorized')
      expect(loc.href).to.not.contain('/products')
    });

    cy.get('form').within(() => {
      cy.get('input[name="username"]').should('exist');
      cy.get('input[name="password"]').should('exist');
    })
  })

  it('redirects when visiting a random page', () => {
    cy.visit(Cypress.env('host') + '/random')
    cy.location().should((loc) => {
      expect(loc.href).to.not.contain('/unauthorized')
      expect(loc.href).to.not.contain('/random')
    });

    cy.get('form').within(() => {
      cy.get('input[name="username"]').should('exist');
      cy.get('input[name="password"]').should('exist');
    })
  })
})
