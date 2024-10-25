export const LANGGRAPH_API_URL =
  process.env.LANGGRAPH_API_URL ?? "http://localhost:53974";
// v2 is tied to the 'open-canvas-prod' deployment.
export const ASSISTANT_ID_COOKIE = "oc_assistant_id_v2";
// export const ASSISTANT_ID_COOKIE = "oc_assistant_id";
export const HAS_ASSISTANT_COOKIE_BEEN_SET = "has_oc_assistant_id_been_set";
export const THREAD_ID_COOKIE_NAME = "oc_thread_id_v2";
export const HAS_EMPTY_THREADS_CLEARED_COOKIE = "has_empty_threads_cleared";
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

export const DEFAULT_MODEL_NAME: ALL_MODEL_NAMES = "claude-3-haiku-20240307";
export const OPENAI_MODEL_NAMES = ["gpt-4o-mini"] as const;
export const ANTHROPIC_MODEL_NAMES = ["claude-3-haiku-20240307"] as const;
export const FIREWORKS_MODEL_NAMES = [
  "accounts/fireworks/models/llama-v3p1-70b-instruct",
  "accounts/fireworks/models/llama-v3p1-8b-instruct",
] as const;

export type OPENAI_MODEL = (typeof OPENAI_MODEL_NAMES)[number];
export type ANTHROPIC_MODEL = (typeof ANTHROPIC_MODEL_NAMES)[number];
export type FIREWORKS_MODEL = (typeof FIREWORKS_MODEL_NAMES)[number];

export type ALL_MODEL_NAMES = OPENAI_MODEL | ANTHROPIC_MODEL | FIREWORKS_MODEL;
