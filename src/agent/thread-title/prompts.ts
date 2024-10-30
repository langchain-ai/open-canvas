export const TITLE_SYSTEM_PROMPT = `You are tasked with generating a concise, descriptive title for a conversation between a user and an AI assistant. The title should capture the main topic or purpose of the conversation.

Guidelines for title generation:
- Keep titles extremely short (ideally 2-5 words)
- Focus on the main topic or goal of the conversation
- Use natural, readable language
- Avoid unnecessary articles (a, an, the) when possible
- Do not include quotes or special characters
- Capitalize important words

Use the 'generate_title' tool to output your title.`;

export const TITLE_USER_PROMPT = `Based on the following conversation, generate a very short and descriptive title for:

{conversation}

{artifact_context}`;
