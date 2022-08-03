/// <reference types="cypress" />

describe('check that product, order and user functionality works as expected', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('host'))

    cy.get('#tenantname').type(Cypress.env('tenantId'))
    cy.contains('Submit').click()
    cy.get('form input[name="username"]').type(Cypress.env('tenantName'))
    cy.get('form input[name="password"]').type(Cypress.env('tenantPassword'))
    cy.get('form button[type="submit"]').click()
  })

  it('can create new users and display them', () => {
    const email_username = Cypress.env('email').split('@')[0];
    const email_domain = Cypress.env('email').split('@')[1];
    const random_suffix = '+test'+Date.now().toString().slice(-3);
    const myUser = {
      name: "myUser-"+Date.now(),
      email: email_username + random_suffix + '@' + email_domain,
      role: 'userRole'+Date.now().toString().slice(-5)
    }
    cy.get("a").contains("Users").click()

    cy.location().should((loc) => {
      expect(loc.href).to.contain('/users/list')
    });

    cy.get("button[color='primary'").contains("Add User").click()
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/users/create')
    });

    cy.get('form').within(() => {
      cy.get('input[formcontrolname="userName"]').type(myUser.name)
      cy.get('input[formcontrolname="userEmail"]').type(myUser.email)
      cy.get('input[formcontrolname="userRole"]').type(myUser.role)
    })

    cy.intercept({
      method: 'POST',
      url: '**/user',
    }).as('postUser')

    cy.intercept({
      method: 'GET',
      url: '**/users',
    }).as('getUsers')
    cy.get("button").contains("Create").click()
    cy.wait('@postUser')

    cy.go('back')

    cy.location().should((loc) => {
      expect(loc.href).to.contain('/users/list')
    });

    cy.wait('@getUsers')

    cy.get('table td').contains(myUser.email)
  })

  it('can create a new order with a new product and see them listed', () => {
    const myProduct = {
      name: "myProduct-"+Date.now(),
      price: Date.now().toString().slice(-3),
      sku: Date.now().toString().slice(-5),
      category: "category1",
    }

    const myOrder = {
      name: "myOrder-"+Date.now(),
      price: Date.now().toString().slice(-3),
      sku: Date.now().toString().slice(-5),
      category: "category2",
    }

    // NOW TESTING PRODUCT CREATION //
    cy.get("a").contains("Products").click()

    cy.location().should((loc) => {
      expect(loc.href).to.contain('/products/list')
    });

    cy.get("button[color='primary'").contains("Create Product").click()
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/products/create')
    });

    cy.get('form').within(() => {
      cy.get('input[formcontrolname="name"]').type(myProduct.name)
      cy.get('input[formcontrolname="price"]').type(myProduct.price)
      cy.get('input[formcontrolname="sku"]').type(myProduct.sku)
      cy.get('mat-select[formcontrolname="category"]').click()
    })
    cy.get('.mat-option-text').contains(myProduct.category).click()

    cy.get("button").contains("Submit").should('not.be.disabled')

    cy.intercept({
      method: 'POST',
      url: '**/product',
    }).as('postProduct')

    cy.intercept({
      method: 'GET',
      url: '**/products',
    }).as('getProducts')

    cy.get("button").contains("Submit").click()
    cy.wait('@postProduct', {timeout: 10 * 1000})

    cy.location().should((loc) => {
      expect(loc.href).to.contain('/products/list')
    });

    cy.wait('@getProducts')

    cy.get('table td').contains(myProduct.name)
    cy.get('table td').contains(myProduct.price)

    cy.get("a").contains("Orders").click()

    // DONE TESTING PRODUCT CREATION //

    // NOW TESTING ORDER CREATION //
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/orders/list')
    });

    cy.get("button[color='primary']").contains("Create Order").click()
    cy.location().should((loc) => {
      expect(loc.href).to.contain('/orders/create')
    });

    cy.get('form').within(() => {
      cy.get('input[formcontrolname="orderName"]').type(myOrder.name)
    })

    cy.get('div .row').contains(myProduct.name).parent().find("button[color='primary']").click()
    cy.get('div .row').contains(myProduct.name).parent().find("button[color='primary']").click()

    cy.intercept({
      method: 'POST',
      url: '**/order',
    }).as('postOrder')

    cy.intercept({
      method: 'GET',
      url: '**/orders',
    }).as('getOrders')

    cy.get("button").contains("Submit").click()
    cy.wait('@postOrder', {timeout: 10 * 1000})

    cy.location().should((loc) => {
      expect(loc.href).to.contain('/orders/list')
    });

    cy.wait('@getOrders')

    cy.get('table td').contains(myOrder.name)
    cy.get('table td').contains(new Intl.NumberFormat().format(myProduct.price * 2))

    // DONE TESTING ORDER CREATION //
  })
})
