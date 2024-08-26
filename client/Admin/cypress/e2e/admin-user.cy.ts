describe('admin user tests', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('host'));

    cy.get('form input[name="username"]').type(Cypress.env('adminUsername'));
    cy.get('form input[name="password"]').type(
      Cypress.env('adminUserPassword')
    );

    cy.intercept({
      url: 'https://cognito-idp.*.amazonaws.com',
    }).as('signIn');

    cy.get('form button[type="submit"]').click();
    cy.wait('@signIn');

    cy.wait(1500);
    cy.get('body').then((body) => {
      if (body.find('form input[name="confirm_password"]').length > 0) {
        cy.get('form input[name="password"]').type(
          Cypress.env('adminUserPassword')
        );
        cy.get('form input[name="confirm_password"]').type(
          Cypress.env('adminUserPassword')
        );

        cy.get('form button[type="submit"]').click();
        cy.wait('@signIn');
      }
      if (body.find('input[name="unverifiedAttr"]').length > 0) {
        cy.get('button').contains('Skip').click();
      }
    });
  });

  it('can create new tenants', () => {
    const myTenant = {
      name: Cypress.env('newTenantName'),
      email: Cypress.env('newTenantEmail'),
      tier: Cypress.env('newTenantTier'),
    };
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/dashboard');
      expect(loc.href).to.not.contain('/unauthorized');
    });

    cy.get('a').contains('Tenants').click();
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/tenants/list');
    });

    cy.get("button[color='primary'").contains('Add Tenant').click();
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/tenants/create');
    });

    cy.get('form').within(() => {
      cy.get('input[formcontrolname="tenantName"]').type(myTenant.name);
      cy.get('input[formcontrolname="tenantEmail"]').type(myTenant.email);
      cy.get('select[formcontrolname="tenantTier"]').select(myTenant.tier);
    });

    cy.intercept({
      method: 'POST',
      url: '**/registration',
    }).as('postRegistration');

    cy.intercept({
      method: 'GET',
      url: '**/tenants',
    }).as('getTenants');

    cy.get('button').contains('Submit').click();
    cy.wait('@postRegistration');

    cy.location().should((loc) => {
      expect(loc.href).to.contain('/tenants/list');
    });

    cy.wait('@getTenants');

    cy.get('table td').contains(myTenant.name).should('be.visible');
    cy.get('table td').contains(myTenant.email).should('be.visible');
    cy.get('table td').contains(myTenant.tier).should('be.visible');
  });
});
