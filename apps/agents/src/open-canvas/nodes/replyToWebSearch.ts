import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { Reflections } from "@opencanvas/shared/types";
import {
  createContextDocumentMessages,
  ensureStoreInConfig,
  formatReflections,
  getModelFromConfig,
  isUsingO1MiniModel,
} from "../../utils.js";
import { REPLY_TO_WEB_SEARCH_PROMPT } from "../prompts.js";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../state.js";

/**
 * Generate a short summary response using web search results without generating artifacts.
 */
export const replyToWebSearch = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = await getModelFromConfig(config, {
    temperature: 0.2,
    maxTokens: 300,
  });

  if (!state.webSearchResults?.length) {
    throw new Error("No web search results found for web search response");
  }

  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);
  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections)
    : "No reflections found.";

  // Get the user's most recent question
  const recentUserMessage = state._messages[state._messages.length - 1];
  if (recentUserMessage.getType() !== "human") {
    throw new Error("Expected a human message");
  }

  // Format web search results
  const webSearchResultsStr = state.webSearchResults
    .map(
      (r, index) =>
        `<search-result
      index="${index}"
      publishedDate="${r.metadata?.publishedDate || "Unknown"}"
      author="${r.metadata?.author || "Unknown"}"
    >
      [${r.metadata?.title || "Unknown title"}](${r.metadata?.url || "Unknown URL"})
      ${r.pageContent}
    </search-result>`
    )
    .join("\n\n");

  const formattedPrompt = REPLY_TO_WEB_SEARCH_PROMPT
    .replace("{reflections}", memoriesAsString)
    .replace("{userQuestion}", recentUserMessage.content)
    .replace("{webSearchResults}", webSearchResultsStr);

  const contextDocumentMessages = await createContextDocumentMessages(config);
  const isO1MiniModel = isUsingO1MiniModel(config);
  const response = await smallModel.invoke([
    { role: isO1MiniModel ? "user" : "system", content: formattedPrompt },
    ...contextDocumentMessages,
    ...state._messages,
  ]);

  return {
    messages: [response],
    _messages: [response],
  };
}; 