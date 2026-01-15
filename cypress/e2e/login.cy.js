/// <reference types="cypress" />
import { URLS, API_URLS } from '../support/urls';
import 'cypress-mochawesome-reporter/register';


describe('Testes Funcionais - Tela de Login', () => {
  let usuarioIdFulano;

  // 🚀 Antes de todos os testes, cria o usuário Fulano da Silva
  before(() => {
    cy.visit(URLS.cadastroUsuarios);

    cy.get('input[name="nome"]').type('Fulano da Silva');
    cy.get('input[name="email"]').type('fulano1@qa.com');
    cy.get('input[name="password"]').type('123456');
    cy.get('input[type="checkbox"]').uncheck();
    cy.get('button[type="submit"]').click();
    cy.contains('Cadastro realizado com sucesso').should('be.visible');

    // captura o ID para excluir depois
    cy.request({
      method: 'GET',
      url: API_URLS.usuarios,
      qs: { email: 'fulano1@qa.com' },
      failOnStatusCode: false,
    }).then((response) => {
      const usuarios = response.body?.usuarios || [];
      if (usuarios.length > 0) {
        usuarioIdFulano = usuarios[0]._id;
      }
    });
  });

  beforeEach(() => {
    cy.visit(URLS.login);
  });

  it('Login válido - deve acessar o sistema', () => {
    cy.get('input[name="email"]').type('fulano1@qa.com');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
    //cy.contains('Bem Vindo Fulano da Silva').should('be.visible');
  });

  it('Login inválido - senha incorreta', () => {
    cy.get('input[name="email"]').type('usuario@teste.com');
    cy.get('input[name="password"]').type('senhaErrada');
    cy.get('button[type="submit"]').click();
    cy.contains('Email e/ou senha inválidos').should('be.visible');
  });

  it('Usuário inexistente', () => {
    cy.get('input[name="email"]').type('naoexiste@teste.com');
    cy.get('input[name="password"]').type('qualquerSenha');
    cy.get('button[type="submit"]').click();
    cy.contains('Email e/ou senha inválidos').should('be.visible');
  });

  it('Campos obrigatórios - não preencher nada', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Email é obrigatório').should('be.visible');
    cy.contains('Password é obrigatório').should('be.visible');
  });

  it('Case sensitivity - email maiúsculo', () => {
    cy.get('input[name="email"]').type('USUARIO@TESTE.COM');
    cy.get('input[name="password"]').type('teste');
    cy.get('button[type="submit"]').click();
    cy.contains('Email e/ou senha inválidos').should('be.visible');
  });

  it('Espaços extras - antes/depois do email', () => {
    cy.get('input[name="email"]').type('    usuario@teste.com     ');
    cy.get('input[name="password"]').type('teste');
    cy.get('button[type="submit"]').click();
    cy.contains('Email e/ou senha inválidos').should('be.visible');
  });

//   it('Caracteres especiais no email', () => {
//     cy.get('input[name="email"]').type('!@@teste.com');
//     cy.get('input[name="password"]').type('teste');
//     cy.get('button[type="submit"]').click();
//     cy.contains('A parte depois de "@" não deve conter o símbolo "@"').should('be.visible');
//   });

  it('Logout - deve encerrar sessão', () => {
    // login válido primeiro
    cy.get('input[name="email"]').type('fulano1@qa.com');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();

    //cy.contains('Logout').click();
    cy.get('[data-testid="logout"]').click();
    cy.url().should('include', '/login');

  });

  // 🚀 Limpeza: exclui o usuário Fulano criado
  after(() => {
    if (usuarioIdFulano) {
      cy.request('DELETE', `${API_URLS.usuarios}/${usuarioIdFulano}`)
        .its('status')
        .should('eq', 200);
    }
  });
});