// cypress/e2e/file-upload.cy.ts
/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />

import { beforeEach, describe, it } from "node:test";

describe('File Upload Functionality', () => {
    beforeEach(() => {
      cy.visit('/');
      
      cy.window().then((win) => {
        win.sessionStorage.clear();
        win.localStorage.clear();
      });
    });
  
    it('should display the upload interface correctly', () => {
      cy.get('[data-testid="upload-area"]').should('be.visible');
      cy.contains('Drag & drop CSV files here').should('be.visible');
    });
  
    it('should upload a CSV file successfully', () => {
      cy.fixture('test.csv').then((fileContent) => {
        cy.get('[data-testid="upload-area"]').attachFile({
          fileContent,
          fileName: 'test.csv',
          mimeType: 'text/csv'
        });
  
        cy.get('[data-testid="file-list"]').within(() => {
          cy.contains('test.csv').should('be.visible');
          cy.get('[data-testid="progress-bar"]').should('exist');
        });
  
        cy.get('[data-testid="file-status"]')
          .contains('Upload complete', { timeout: 10000 })
          .should('be.visible');
      });
    });
  
    it('should handle multiple file uploads', () => {
      const files = ['test1.csv', 'test2.csv'];
      
      files.forEach(file => {
        cy.fixture(file).then((fileContent) => {
          cy.get('[data-testid="upload-area"]').attachFile({
            fileContent,
            fileName: file,
            mimeType: 'text/csv'
          });
        });
      });
  
      files.forEach(file => {
        cy.get('[data-testid="file-list"]').contains(file).should('be.visible');
      });
    });
  
    it('should handle invalid file types', () => {
      cy.fixture('invalid.txt').then((fileContent) => {
        cy.get('[data-testid="upload-area"]').attachFile({
          fileContent,
          fileName: 'invalid.txt',
          mimeType: 'text/plain'
        });
      });
  
      cy.get('[data-testid="error-message"]')
        .contains('Only CSV files are allowed')
        .should('be.visible');
    });
  
    it('should allow file deletion', () => {
      cy.fixture('test.csv').then((fileContent) => {
        cy.get('[data-testid="upload-area"]').attachFile({
          fileContent,
          fileName: 'test.csv',
          mimeType: 'text/csv'
        });
      });
  
      cy.get('[data-testid="file-list"]').within(() => {
        cy.contains('test.csv').should('be.visible');
        cy.get('[data-testid="delete-button"]').click();
      });
  
      cy.get('[data-testid="file-list"]')
        .contains('test.csv')
        .should('not.exist');
    });
  
    it('should handle network errors', () => {
      cy?.intercept('POST', '/api/upload/**', {
        statusCode: 500,
        body: { error: 'Network error' }
      });
  
      cy.fixture('test.csv').then((fileContent) => {
        cy.get('[data-testid="upload-area"]').attachFile({
          fileContent,
          fileName: 'test.csv',
          mimeType: 'text/csv'
        });
      });
  
      cy.get('[data-testid="error-message"]')
        .contains('Upload failed')
        .should('be.visible');
    });
  
    it('should display upload progress', () => {
      cy.fixture('test.csv').then((fileContent) => {
        cy.get('[data-testid="upload-area"]').attachFile({
          fileContent,
          fileName: 'test.csv',
          mimeType: 'text/csv'
        });
      });
  
      cy.get('[data-testid="progress-bar"]').should('exist');
      cy.get('[data-testid="progress-value"]')
        .invoke('attr', 'style')
        .should('include', 'width:');
    });
});