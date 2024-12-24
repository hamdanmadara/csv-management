// cypress/support/index.d.ts
/// <reference types="cypress" />
/// <reference types="cypress-file-upload" />
/// <reference types="@types/jquery" />

interface FileUploadOptions {
    fileContent?: any;
    fileName?: string;
    mimeType?: string;
    lastModified?: number;
    force?: boolean;
    subjectType?: string;
  }
  
  declare namespace Cypress {
    interface Chainable<Subject = any> {
      attachFile(
        fileOrArray: string | Blob | FileUploadOptions,
        options?: FileUploadOptions
      ): Chainable<Element>;
      intercept(url: string | RegExp, response?: any): Chainable<null>;
      intercept(method: string, url: string | RegExp, response?: any): Chainable<null>;
    }
  }