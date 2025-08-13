import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { Reflections } from "@opencanvas/shared/types";
import {
  createContextDocumentMessages,
  ensureStoreInConfig,
  formatArtifactContentWithTemplate,
  formatReflections,
  getModelFromConfig,
  isUsingO1MiniModel,
} from "../../utils.js";
import { REPLY_TO_FOLLOWUP_QUESTION_PROMPT } from "../prompts.js";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../state.js";

/**
 * Generate responses to follow-up questions about artifacts without modifying them.
 */
export const replyToFollowupQuestion = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = await getModelFromConfig(config);

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  if (!currentArtifactContent) {
    throw new Error("No artifact found for follow-up question");
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

  const formattedPrompt = REPLY_TO_FOLLOWUP_QUESTION_PROMPT
    .replace("{reflections}", memoriesAsString)
    .replace(
      "{artifactContent}",
      formatArtifactContentWithTemplate(
        "{artifact}",
        currentArtifactContent
      )
    )
    .replace("{userQuestion}", recentUserMessage.content);

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