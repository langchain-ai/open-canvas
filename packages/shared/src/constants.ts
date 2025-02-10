import { ProgrammingLanguageOptions } from "./types.js";

export const OC_SUMMARIZED_MESSAGE_KEY = "__oc_summarized_message";
export const OC_HIDE_FROM_UI_KEY = "__oc_hide_from_ui";
export const OC_WEB_SEARCH_RESULTS_MESSAGE_KEY =
  "__oc_web_search_results_message";

export const CONTEXT_DOCUMENTS_NAMESPACE = ["context_documents"];

export const DEFAULT_INPUTS = {
  highlightedCode: undefined,
  highlightedText: undefined,
  next: undefined,
  language: undefined,
  artifactLength: undefined,
  regenerateWithEmojis: undefined,
  readingLevel: undefined,
  addComments: undefined,
  addLogs: undefined,
  fixBugs: undefined,
  portLanguage: undefined,
  customQuickActionId: undefined,
  webSearchEnabled: undefined,
  webSearchResults: undefined,
};

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
    language: "json",
    label: "JSON",
  },
  {
    language: "rust",
    label: "Rust",
  },
  {
    language: "xml",
    label: "XML",
  },
  {
    language: "clojure",
    label: "Clojure",
  },
  {
    language: "csharp",
    label: "C#",
  },
  {
    language: "other",
    label: "Other",
  },
];
