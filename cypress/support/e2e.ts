// cypress/support/e2e.ts
/// <reference types="cypress" />
/// <reference types="@types/jquery" />
import 'cypress-file-upload';

interface FileUploadOptions {
  fileContent?: any;
  fileName?: string;
  mimeType?: string;
  lastModified?: number;
  force?: boolean;
  subjectType?: string;
}

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      attachFile(
        fileOrArray: string | Blob | FileUploadOptions,
        options?: FileUploadOptions
      ): Chainable<Element>;
      intercept(url: string | RegExp, response?: any): Chainable<null>;
      intercept(method: string, url: string | RegExp, response?: any): Chainable<null>;
    }
  }
}