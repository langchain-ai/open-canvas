const COOKIE_PREFIX = "content_composer";
export const ASSISTANT_ID_COOKIE = `${COOKIE_PREFIX}_assistant_id`;
export const HAS_SEEN_DIALOG = `${COOKIE_PREFIX}_has_seen_dialog`;
export const USER_TIED_TO_ASSISTANT = `${COOKIE_PREFIX}_user_tied_to_assistant`;
export const USER_ID_COOKIE = `${COOKIE_PREFIX}_user_id`;
export const DEFAULT_SYSTEM_RULES = [
  "Ensure the tone and style of the generated text matches the user's desired tone and style.",
  "Be concise and avoid unnecessary information unless the user specifies otherwise.",
  "Maintain consistency in terminology and phrasing as per the user's revisions.",
  "Be mindful of the context and purpose of the text to ensure it aligns with the user's goals.",
];
