import { Block } from "@blocknote/core";

export type Message = {
  id: string;
  text?: string;
  rawResponse?: Record<string, any>;
  sender: string;
  toolCalls?: ToolCall[];
};

export interface ToolCall {
  id: string;
  name: string;
  args: string;
  result?: any;
}

export type Model = "gpt-4o-mini" | string; // Add other model options as needed

export type UserRules = {
  styleRules: string[];
  contentRules: string[];
};

export interface Artifact {
  id: string;
  contents: ArtifactContent[];
  currentContentIndex: number;
}

export interface ArtifactContent {
  index: number;
  content: string;
  title: string;
  type: ArtifactType;
  language: string;
}

export interface ArtifactV2 {
  id: string;
  contents: (ArtifactMarkdownContent | ArtifactCodeContent)[];
  currentContentIndex: number;
}

export interface ArtifactMarkdownContent {
  index: number;
  markdownBlocks: {
    markdown: string;
    blockId: string;
    block: Block;
  }[];
  title: string;
  type: "text";
}

export interface ArtifactCodeContent {
  index: number;
  code: string;
  title: string;
  type: "code";
  language: ProgrammingLanguageOptions;
}

export type ArtifactType = "code" | "text";

export interface Highlight {
  /**
   * The index of the first character of the highlighted text
   */
  startCharIndex: number;
  /**
   * The index of the last character of the highlighted text
   */
  endCharIndex: number;
  /**
   * Data from the highlighted text
   */
  textData?: {
    /**
     * The blocks in which the selected text is found
     */
    blocks: {
      markdown: string;
      blockId: string;
    }[];
    /**
     * The selected text.
     */
    selectedText: string;
  };
}

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
  | "other";

export const PROGRAMMING_LANGUAGES: Array<{
  language: ProgrammingLanguageOptions;
  label: string;
}> = [
  {
    language: "typescript",
    label: "TypeScript",
  },
  {
    language: "javascript",
    label: "JavaScript",
  },
  {
    language: "cpp",
    label: "C++",
  },
  {
    language: "java",
    label: "Java",
  },
  {
    language: "php",
    label: "PHP",
  },
  {
    language: "python",
    label: "Python",
  },
  {
    language: "html",
    label: "HTML",
  },
  {
    language: "sql",
    label: "SQL",
  },
  {
    language: "other",
    label: "Other",
  },
];

export type ArtifactLengthOptions = "shortest" | "short" | "long" | "longest";

export type ReadingLevelOptions =
  | "pirate"
  | "child"
  | "teenager"
  | "college"
  | "phd";

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
