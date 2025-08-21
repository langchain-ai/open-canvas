// Stubbing @opencanvas/shared module
declare module '@opencanvas/shared/types' {
  export interface ArtifactV3 {
    // Add common properties as needed
  }

  export interface ArtifactMarkdownV3 extends ArtifactV3 {
    fullMarkdown: string;
    // Add other properties as needed
  }

  export interface ArtifactCodeV3 extends ArtifactV3 {
    code: string;
    // Add other properties as needed
  }

  export interface ContextDocument {
    // Add properties as needed
  }

  export interface SearchResult {
    // Add properties as needed
  }

  // Add other necessary types
}

declare module '@opencanvas/shared/utils/artifacts' {
  export function isArtifactCodeContent(content: any): boolean;
  export function isArtifactMarkdownContent(content: any): boolean;
  // Add other necessary functions or types
}

declare module '@opencanvas/shared' {
  export interface ContextDocument {
    // Add properties as needed
  }
  // Add other necessary exports
}