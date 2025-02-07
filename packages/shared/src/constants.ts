import {
  CustomModelConfig,
  ModelConfigurationParams,
  ProgrammingLanguageOptions,
} from "./types.js";

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

export const AZURE_MODELS: ModelConfigurationParams[] = [
  {
    name: "azure/gpt-4o-mini",
    label: "GPT-4o mini (Azure)",
    isNew: false,
    config: {
      provider: "azure_openai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 4096,
        default: 4096,
        current: 4096,
      },
    },
  },
];

export const OPENAI_MODELS: ModelConfigurationParams[] = [
  {
    name: "gpt-4o",
    label: "GPT-4o",
    config: {
      provider: "openai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 16384,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
  {
    name: "gpt-4o-mini",
    label: "GPT-4o mini",
    config: {
      provider: "openai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 16384,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
  {
    name: "o3-mini",
    label: "o3 mini",
    config: {
      provider: "openai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 100000,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
  {
    name: "o1-mini",
    label: "o1 mini",
    config: {
      provider: "openai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 65536,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
  {
    name: "o1",
    label: "o1",
    config: {
      provider: "openai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 100000,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
];

/**
 * Ollama model names _MUST_ be prefixed with `"ollama-"`
 */
export const OLLAMA_MODELS = [
  {
    name: "ollama-llama3.3",
    label: "Llama 3.3 70B (local)",
    config: {
      provider: "ollama",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 2048,
        default: 2048,
        current: 2048,
      },
    },
    isNew: true,
  },
];

export const ANTHROPIC_MODELS = [
  {
    name: "claude-3-5-sonnet-latest",
    label: "Claude 3.5 Sonnet",
    config: {
      provider: "anthropic",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 8192,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
  {
    name: "claude-3-5-haiku-20241022",
    label: "Claude 3.5 Haiku",
    config: {
      provider: "anthropic",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 8192,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
  {
    name: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku (old)",
    config: {
      provider: "anthropic",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 4096,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
];

export const FIREWORKS_MODELS: ModelConfigurationParams[] = [
  {
    name: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    label: "Llama 3.3 70B",
    config: {
      provider: "fireworks",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 16384,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
  {
    name: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    label: "Llama 70B (old)",
    config: {
      provider: "fireworks",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 16384,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
  {
    name: "accounts/fireworks/models/deepseek-v3",
    label: "DeepSeek V3",
    config: {
      provider: "fireworks",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 8000,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
  {
    name: "accounts/fireworks/models/deepseek-r1",
    label: "DeepSeek R1",
    config: {
      provider: "fireworks",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 8000,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
];

export const GROQ_MODELS: ModelConfigurationParams[] = [
  {
    name: "groq/deepseek-r1-distill-llama-70b",
    label: "DeepSeek R1 Llama 70b Distill",
    config: {
      provider: "groq",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 8000,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
];

export const GEMINI_MODELS: ModelConfigurationParams[] = [
  {
    name: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    config: {
      provider: "google-genai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 8192,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
  {
    name: "gemini-2.0-flash-exp",
    label: "Gemini 2.0 Flash",
    config: {
      provider: "google-genai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 1048576,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
  {
    name: "gemini-2.0-flash-thinking-exp-01-21",
    label: "Gemini 2.0 Flash Thinking",
    config: {
      provider: "google-genai",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 1048576,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
  },
];

export const LANGCHAIN_USER_ONLY_MODELS = [
  "o1",
  "gpt-4o",
  "claude-3-5-sonnet-latest",
  "gemini-2.0-flash-thinking-exp-01-21",
];

export const TEMPERATURE_EXCLUDED_MODELS = ["o1-mini", "o3-mini", "o1"];

// Models which do NOT stream back tool calls.
export const NON_STREAMING_TOOL_CALLING_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
];
// Models which do NOT stream back text.
export const NON_STREAMING_TEXT_MODELS = [
  "o1",
  "gemini-2.0-flash-thinking-exp-01-21",
];
// Models which preform CoT before generating a final response.
export const THINKING_MODELS = [
  "accounts/fireworks/models/deepseek-r1",
  "groq/deepseek-r1-distill-llama-70b",
];

export const ALL_MODELS: ModelConfigurationParams[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...FIREWORKS_MODELS,
  ...GEMINI_MODELS,
  ...AZURE_MODELS,
  ...OLLAMA_MODELS,
  ...GROQ_MODELS,
];

export type OPENAI_MODEL_NAMES = (typeof OPENAI_MODELS)[number]["name"];
export type ANTHROPIC_MODEL_NAMES = (typeof ANTHROPIC_MODELS)[number]["name"];
export type FIREWORKS_MODEL_NAMES = (typeof FIREWORKS_MODELS)[number]["name"];
export type GEMINI_MODEL_NAMES = (typeof GEMINI_MODELS)[number]["name"];
export type AZURE_MODEL_NAMES = (typeof AZURE_MODELS)[number]["name"];
export type OLLAMA_MODEL_NAMES = (typeof OLLAMA_MODELS)[number]["name"];
export type GROQ_MODEL_NAMES = (typeof GROQ_MODELS)[number]["name"];
export type ALL_MODEL_NAMES =
  | OPENAI_MODEL_NAMES
  | ANTHROPIC_MODEL_NAMES
  | FIREWORKS_MODEL_NAMES
  | GEMINI_MODEL_NAMES
  | AZURE_MODEL_NAMES
  | OLLAMA_MODEL_NAMES
  | GROQ_MODEL_NAMES;

export const DEFAULT_MODEL_NAME: ALL_MODEL_NAMES = OPENAI_MODELS[0].name;
export const DEFAULT_MODEL_CONFIG: CustomModelConfig = {
  ...OPENAI_MODELS[0].config,
  temperatureRange: { ...OPENAI_MODELS[0].config.temperatureRange },
  maxTokens: { ...OPENAI_MODELS[0].config.maxTokens },
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
