export const LANGGRAPH_API_URL =
  process.env.LANGGRAPH_API_URL ?? "http://localhost:54367";
// v2 is tied to the 'open-canvas-prod' deployment.
export const ASSISTANT_ID_COOKIE = "oc_assistant_id_v2";
// export const ASSISTANT_ID_COOKIE = "oc_assistant_id";
export const HAS_ASSISTANT_COOKIE_BEEN_SET = "has_oc_assistant_id_been_set";
/**
 * @deprecated - use THREAD_ID_LS_NAME and local storage from now on.
 */
export const THREAD_ID_COOKIE_NAME = "oc_thread_id_v2";
export const THREAD_ID_LS_NAME = "oc_thread_id";
export const HAS_EMPTY_THREADS_CLEARED_COOKIE = "has_empty_threads_cleared";
export const OC_HAS_SEEN_CUSTOM_ASSISTANTS_ALERT =
  "oc_has_seen_custom_assistants_alert";
export const THREAD_ID_QUERY_PARAM = "threadId";
export const WEB_SEARCH_RESULTS_QUERY_PARAM = "webSearchResults";

export const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/m4a",
  "audio/wav",
  "audio/webm",
]);
export const ALLOWED_AUDIO_TYPE_ENDINGS = [
  ".mp3",
  ".mpga",
  ".m4a",
  ".wav",
  ".webm",
];
export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/mpeg",
  "video/webm",
]);
export const ALLOWED_VIDEO_TYPE_ENDINGS = [".mp4", ".mpeg", ".webm"];

export const CHAT_COLLAPSED_QUERY_PARAM = "chatCollapsed";
