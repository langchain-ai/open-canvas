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
  content: string;
  title: string;
  type: "code" | "text";
  language: string;
}

export interface Highlight {
  /**
   * The id of the artifact the highlighted text belongs to
   */
  id: string;
  /**
   * The index of the first character of the highlighted text
   */
  startCharIndex: number;
  /**
   * The index of the last character of the highlighted text
   */
  endCharIndex: number;
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
  | "python";

export type ArtifactLengthOptions = "shortest" | "short" | "long" | "longest";

export type ReadingLevelOptions =
  | "pirate"
  | "child"
  | "teenager"
  | "college"
  | "phd";
