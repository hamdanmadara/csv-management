// /// <reference types="cypress" />

// // This line tells TypeScript this is a test file
// declare const describe: Mocha.SuiteFunction;
// declare const it: Mocha.TestFunction;
// declare const cy: Cypress.cy & CyEventEmitter;
// declare const beforeEach: Mocha.HookFunction;

// describe('CSV Manager Application', () => {
//   beforeEach(() => {
//     cy.visit('http://localhost:3000');
//   });

//   describe('Navigation', () => {
//     it('should show homepage with Get Started button', () => {
//       cy.contains('CSV File Management System').should('be.visible');
//       cy.contains('Get Started').should('be.visible');
//     });

//     it('should navigate through all pages', () => {
//       // Test Upload page navigation
//       cy.contains('Upload').click();
//       cy.url().should('include', '/upload');
      
//       // Test Listing page navigation
//       cy.contains('Listing').click();
//       cy.url().should('include', '/listing');
      
//       // Test Home page navigation
//       cy.contains('Home').click();
//       cy.url().should('not.include', '/upload');
//     });
//   });

//   describe('File Upload', () => {
//     beforeEach(() => {
//       cy.visit('http://localhost:3000/upload');
//     });

//     it('should display upload area', () => {
//       cy.contains('Drag & drop CSV files here').should('be.visible');
//     });

//     it('should upload CSV file successfully', () => {
//       // Create a sample CSV file
//       cy.fixture('sample.csv').then((fileContent: string) => {
//         // Upload the file
//         cy.get('input[type="file"]').attachFile({
//           fileContent,
//           fileName: 'test.csv',
//           mimeType: 'text/csv'
//         });

//         // Check if file appears in upload list
//         cy.contains('test.csv').should('be.visible');
        
//         // Wait for upload to complete and check success message
//         cy.contains('uploaded successfully', { timeout: 10000 }).should('be.visible');
//       });
//     });

//     it('should reject non-CSV files', () => {
//       cy.fixture('invalid.txt').then((fileContent: string) => {
//         cy.get('input[type="file"]').attachFile({
//           fileContent,
//           fileName: 'invalid.txt',
//           mimeType: 'text/plain'
//         });
        
//         // Should show error message
//         cy.contains('Only CSV files are allowed').should('be.visible');
//       });
//     });
//   });

//   describe('File Listing', () => {
//     beforeEach(() => {
//       cy.visit('http://localhost:3000/listing');
//     });

//     it('should display uploaded files', () => {
//       // Check if the list container exists
//       cy.get('[data-testid="file-list"]').should('exist');
      
//       // If there are files, check their elements
//       cy.get('[data-testid="file-list"]').then(($list: JQuery<HTMLElement>) => {
//         if ($list.find('[data-testid="file-card"]').length > 0) {
//           cy.get('[data-testid="file-card"]').first().within(() => {
//             // Check if basic file information is displayed
//             cy.get('[data-testid="file-name"]').should('be.visible');
//             cy.get('[data-testid="preview-button"]').should('be.visible');
//             cy.get('[data-testid="download-button"]').should('be.visible');
//           });
//         } else {
//           // If no files, check for empty state message
//           cy.contains('No files uploaded yet').should('be.visible');
//         }
//       });
//     });

//     it('should download file when clicking download button', () => {
//       cy.get('[data-testid="file-list"]').then(($list: JQuery<HTMLElement>) => {
//         if ($list.find('[data-testid="file-card"]').length > 0) {
//           cy.get('[data-testid="download-button"]').first().click();
//           // Note: Can't test actual download in Cypress, but can check if request was made
//           cy.contains('downloading').should('exist');
//         }
//       });
//     });
//   });
// });