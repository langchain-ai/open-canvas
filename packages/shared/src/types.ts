import { DocumentInterface } from "@langchain/core/documents";

export interface ModelConfigurationParams {
  name: string;
  label: string;
  modelName?: string;
  config: CustomModelConfig;
  isNew: boolean;
}

export interface CustomModelConfig {
  provider: string;
  temperatureRange: {
    min: number;
    max: number;
    default: number;
    current: number;
  };
  maxTokens: {
    min: number;
    max: number;
    default: number;
    current: number;
  };
  azureConfig?: {
    azureOpenAIApiKey: string;
    azureOpenAIApiInstanceName: string;
    azureOpenAIApiDeploymentName: string;
    azureOpenAIApiVersion: string;
    azureOpenAIBasePath?: string;
  };
}

export type ArtifactLengthOptions = "shortest" | "short" | "long" | "longest";

export type ArtifactType = "code" | "text";

export interface ArtifactContent {
  index: number;
  content: string;
  title: string;
  type: ArtifactType;
  language: string;
}

export interface Artifact {
  id: string;
  contents: ArtifactContent[];
  currentContentIndex: number;
}

export interface ArtifactToolResponse {
  artifact?: string;
  title?: string;
  language?: string;
  type?: string;
}

export type RewriteArtifactMetaToolResponse =
  | {
      type: "text";
      title?: string;
      language: ProgrammingLanguageOptions;
    }
  | {
      type: "code";
      title: string;
      language: ProgrammingLanguageOptions;
    };

export type LanguageOptions =
  | "english"
  | "mandarin"
  | "spanish"
  | "french"
  | "hindi";

export type ProgrammingLanguageOptions =
  | "typescript"
  | "javascript"
  | "cpp"
  | "java"
  | "php"
  | "python"
  | "html"
  | "sql"
  | "json"
  | "rust"
  | "xml"
  | "clojure"
  | "csharp"
  | "other";

export type ReadingLevelOptions =
  | "pirate"
  | "child"
  | "teenager"
  | "college"
  | "phd";

export interface CodeHighlight {
  startCharIndex: number;
  endCharIndex: number;
}

export interface ArtifactMarkdownV3 {
  index: number;
  type: "text";
  title: string;
  fullMarkdown: string;
}

export interface ArtifactCodeV3 {
  index: number;
  type: "code";
  title: string;
  language: ProgrammingLanguageOptions;
  code: string;
}

export interface ArtifactV3 {
  currentIndex: number;
  contents: (ArtifactMarkdownV3 | ArtifactCodeV3)[];
}

export interface TextHighlight {
  fullMarkdown: string;
  markdownBlock: string;
  selectedText: string;
}

export interface CustomQuickAction {
  /**
   * A UUID for the quick action. Used to identify the quick action.
   */
  id: string;
  /**
   * The title of the quick action. Used in the UI
   * to display the quick action.
   */
  title: string;
  /**
   * The prompt to use when the quick action is invoked.
   */
  prompt: string;
  /**
   * Whether or not to include the user's reflections in the prompt.
   */
  includeReflections: boolean;
  /**
   * Whether or not to include the default prefix in the prompt.
   */
  includePrefix: boolean;
  /**
   * Whether or not to include the last 5 (or less) messages in the prompt.
   */
  includeRecentHistory: boolean;
}

export interface Reflections {
  /**
   * Style rules to follow for generating content.
   */
  styleRules: string[];
  /**
   * Key content to remember about the user when generating content.
   */
  content: string[];
}

export type ContextDocument = {
  /**
   * The name of the document.
   */
  name: string;
  /**
   * The type of the document.
   */
  type: string;
  /**
   * The base64 encoded content of the document, or plain
   * text value if the type is `text`
   */
  data: string;
  /**
   * Optional metadata about the document.
   */
  metadata?: Record<string, any>;
};

/**
 * The metadata included in search results from Exa.
 */
export type ExaMetadata = {
  id: string;
  url: string;
  title: string;
  author: string;
  publishedDate: string;
  image?: string;
  favicon?: string;
};

export type SearchResult = DocumentInterface<ExaMetadata>;

export interface GraphInput {
  messages?: Record<string, any>[];

  highlightedCode?: CodeHighlight;
  highlightedText?: TextHighlight;

  artifact?: ArtifactV3;

  next?: string;

  language?: LanguageOptions;
  artifactLength?: ArtifactLengthOptions;
  regenerateWithEmojis?: boolean;
  readingLevel?: ReadingLevelOptions;

  addComments?: boolean;
  addLogs?: boolean;
  portLanguage?: ProgrammingLanguageOptions;
  fixBugs?: boolean;
  customQuickActionId?: string;

  webSearchEnabled?: boolean;
  webSearchResults?: SearchResult[];
}
