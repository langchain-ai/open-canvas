import { CustomModelConfig, ModelConfigurationParams } from "./types";

export const LANGGRAPH_API_URL =
  process.env.LANGGRAPH_API_URL ?? "http://localhost:54646";
// v2 is tied to the 'open-canvas-prod' deployment.
export const ASSISTANT_ID_COOKIE = "oc_assistant_id_v2";
// export const ASSISTANT_ID_COOKIE = "oc_assistant_id";
export const HAS_ASSISTANT_COOKIE_BEEN_SET = "has_oc_assistant_id_been_set";
export const THREAD_ID_COOKIE_NAME = "oc_thread_id_v2";
export const HAS_EMPTY_THREADS_CLEARED_COOKIE = "has_empty_threads_cleared";
export const LS_HAS_SEEN_MODEL_DROPDOWN_ALERT =
  "oc_has_seen_model_dropdown_alert";
export const OC_HAS_SEEN_CUSTOM_ASSISTANTS_ALERT =
  "oc_has_seen_custom_assistants_alert";
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
};

export const OPENAI_MODELS: ModelConfigurationParams[] = [
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
];
export const ANTHROPIC_MODELS: ModelConfigurationParams[] = [
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
        max: 4096,
        default: 4096,
        current: 4096,
      },
    },
    isNew: true,
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
        max: 8192,
        default: 4096,
        current: 4096,
      },
    },
    isNew: false,
  },
];
export const FIREWORKS_MODELS: ModelConfigurationParams[] = [
  {
    name: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    label: "Fireworks Llama 70B",
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
];

export const DEFAULT_MODEL_NAME: ALL_MODEL_NAMES = OPENAI_MODELS[0].name;
export const DEFAULT_MODEL_CONFIG: CustomModelConfig = OPENAI_MODELS[0].config;

export type OPENAI_MODEL_NAMES = (typeof OPENAI_MODELS)[number]["name"];
export type ANTHROPIC_MODEL_NAMES = (typeof ANTHROPIC_MODELS)[number]["name"];
export type FIREWORKS_MODEL_NAMES = (typeof FIREWORKS_MODELS)[number]["name"];
export type GEMINI_MODEL_NAMES = (typeof GEMINI_MODELS)[number]["name"];
export type ALL_MODEL_NAMES =
  | OPENAI_MODEL_NAMES
  | ANTHROPIC_MODEL_NAMES
  | FIREWORKS_MODEL_NAMES
  | GEMINI_MODEL_NAMES;
