/// <reference types="cypress" />
import { URLS, API_URLS } from '../support/urls';
import 'cypress-mochawesome-reporter/register';


describe('Testes Funcionais - Cadastro de Usuário com limpeza final', () => {
  let usuarioId1;
  let usuarioId2;
  let usuarioIdDuplicado;
  let usuarioIdEspecial; // ID do teste de nome com caracteres especiais
  let email1;
  let email2;
  let emailEspecial; // email usado no teste de caracteres especiais

  beforeEach(() => {
    cy.visit(URLS.cadastroUsuarios);
  });

  it('Cadastro válido - usuário padrão', () => {
    email1 = `fulano${Date.now()}@teste.com`;
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type(email1);
    cy.get('input[name="password"]').type('123456');
    cy.get('input[type="checkbox"]').uncheck();
    cy.get('button[type="submit"]').click();
    cy.contains('Cadastro realizado com sucesso').should('be.visible');

    cy.request({
      method: 'GET',
      url: API_URLS.usuarios,
      qs: { email: email1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 404]);
      const usuarios = response.body?.usuarios || [];
      expect(usuarios.length, `Nenhum usuário encontrado para ${email1}`).to.be.greaterThan(0);
      usuarioId1 = usuarios[0]._id;
    });
  });

  it('Cadastro válido - usuário administrador', () => {
    email2 = `admin${Date.now()}@teste.com`;
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type(email2);
    cy.get('input[name="password"]').type('123456');
    cy.get('input[type="checkbox"]').check();
    cy.get('button[type="submit"]').click();
    cy.contains('Cadastro realizado com sucesso').should('be.visible');

    cy.request({
      method: 'GET',
      url: API_URLS.usuarios,
      qs: { email: email2 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 404]);
      const usuarios = response.body?.usuarios || [];
      expect(usuarios.length, `Nenhum usuário encontrado para ${email2}`).to.be.greaterThan(0);
      usuarioId2 = usuarios[0]._id;
    });
  });

  it('Campo Nome vazio', () => {
    cy.get('input[name="email"]').type(`semnome${Date.now()}@teste.com`);
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Nome é obrigatório').should('be.visible');
  });

  it('Campo Email vazio', () => {
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Email é obrigatório').should('be.visible');
  });

  it('Campo Senha vazio', () => {
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type(`semSenha${Date.now()}@teste.com`);
    cy.get('button[type="submit"]').click();
    cy.contains('Password é obrigatório').should('be.visible');
  });

  it('Email já existente', () => {
    const emailDuplicado = `duplicado${Date.now()}@teste.com`; // timestamp evita conflito

    // primeiro cadastro
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type(emailDuplicado);
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Cadastro realizado com sucesso').should('be.visible');

    // captura o ID do usuário duplicado
    cy.request({
      method: 'GET',
      url: API_URLS.usuarios,
      qs: { email: emailDuplicado },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 404]);
      const usuarios = response.body?.usuarios || [];
      expect(usuarios.length, `Nenhum usuário encontrado para ${emailDuplicado}`).to.be.greaterThan(0);
      usuarioIdDuplicado = usuarios[0]._id;
    });

    // tentar cadastrar novamente
    cy.visit(URLS.cadastroUsuarios);
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type(emailDuplicado);
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Este email já está sendo usado').should('be.visible');
  });

  it('Nome com caracteres especiais', () => {
    emailEspecial = `especial${Date.now()}@teste.com`;
    cy.get('input[name="nome"]').type('Fulano da Silva!@#');
    cy.get('input[name="email"]').type(emailEspecial);
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains('Cadastro realizado com sucesso').should('be.visible');

    // captura o ID do usuário criado com nome especial
    cy.request({
      method: 'GET',
      url: API_URLS.usuarios,
      qs: { email: emailEspecial },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 404]);
      const usuarios = response.body?.usuarios || [];
      expect(usuarios.length, `Nenhum usuário encontrado para ${emailEspecial}`).to.be.greaterThan(0);
      usuarioIdEspecial = usuarios[0]._id;
    });
  });

  it('Valida mensagem nativa de email inválido', () => {
    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type('emailinvalido'); // sem @
    cy.get('input[name="password"]').type('123456');

    cy.get('input[name="email"]').then(($input) => {
      const mensagem = $input[0].validationMessage;
      cy.log(`Mensagem retornada: ${mensagem}`);
      expect(mensagem).to.include('Inclua um "@"');
    });

    // garante que não houve cadastro
    cy.get('button[type="submit"]').click();
    cy.contains('Cadastro realizado com sucesso').should('not.exist');
  });

  after(() => {
    if (usuarioId1) {
      cy.request('DELETE', `${API_URLS.usuarios}/${usuarioId1}`)
        .its('status')
        .should('eq', 200);
    }

    if (usuarioId2) {
      cy.request('DELETE', `${API_URLS.usuarios}/${usuarioId2}`)
        .its('status')
        .should('eq', 200);
    }

    if (usuarioIdDuplicado) {
      cy.request('DELETE', `${API_URLS.usuarios}/${usuarioIdDuplicado}`)
        .its('status')
        .should('eq', 200);
    }

    if (usuarioIdEspecial) {
      cy.request('DELETE', `${API_URLS.usuarios}/${usuarioIdEspecial}`)
        .its('status')
        .should('eq', 200);
    }
  });
});