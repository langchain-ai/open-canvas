export const LANGGRAPH_API_URL =
  process.env.LANGGRAPH_API_URL ?? "http://localhost:64129";
// v2 is tied to the 'open-canvas-prod' deployment.
export const ASSISTANT_ID_COOKIE = "oc_assistant_id_v2";
// export const ASSISTANT_ID_COOKIE = "oc_assistant_id";
export const HAS_ASSISTANT_COOKIE_BEEN_SET = "has_oc_assistant_id_been_set";
export const THREAD_ID_COOKIE_NAME = "oc_thread_id_v2";
export const HAS_EMPTY_THREADS_CLEARED_COOKIE = "has_empty_threads_cleared";
export const LS_HAS_SEEN_MODEL_DROPDOWN_ALERT =
  "oc_has_seen_model_dropdown_alert";
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

export const OPENAI_MODELS = [
  {
    name: "gpt-4o-mini",
    label: "GPT-4o mini",
    isNew: false,
  },
];
export const ANTHROPIC_MODELS = [
  {
    name: "claude-3-5-haiku-20241022",
    label: "Claude 3.5 Haiku",
    isNew: true,
  },
  // {
  //   name: "claude-3-5-sonnet-20240620",
  //   label: "Claude 3.5 Sonnet",
  // },
];
export const FIREWORKS_MODELS = [
  {
    name: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    label: "Fireworks Llama 70B",
    isNew: false,
  },
];

export const GEMINI_MODELS = [
  {
    name: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    isNew: false,
  },
];
export const DEFAULT_MODEL_NAME: ALL_MODEL_NAMES = "claude-3-5-haiku-20241022";
export type OPENAI_MODEL_NAMES = (typeof OPENAI_MODELS)[number]["name"];
export type ANTHROPIC_MODEL_NAMES = (typeof ANTHROPIC_MODELS)[number]["name"];
export type FIREWORKS_MODEL_NAMES = (typeof FIREWORKS_MODELS)[number]["name"];
export type GEMINI_MODEL_NAMES = (typeof GEMINI_MODELS)[number]["name"];
export type ALL_MODEL_NAMES =
  | OPENAI_MODEL_NAMES
  | ANTHROPIC_MODEL_NAMES
  | FIREWORKS_MODEL_NAMES
  | GEMINI_MODEL_NAMES;
