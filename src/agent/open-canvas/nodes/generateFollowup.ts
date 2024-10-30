import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { initChatModel } from "langchain/chat_models/universal";
import { getArtifactContent } from "../../../contexts/utils";
import { isArtifactMarkdownContent } from "../../../lib/artifact_content_types";
import { Reflections } from "../../../types";
import {
  ensureStoreInConfig,
  formatReflections,
  getModelNameAndProviderFromConfig,
} from "../../utils";
import { FOLLOWUP_ARTIFACT_PROMPT } from "../prompts";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";

/**
 * Generate a followup message after generating or updating an artifact.
 */
export const generateFollowup = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const { modelName, modelProvider } =
    getModelNameAndProviderFromConfig(config);
  const smallModel = await initChatModel(modelName, {
    temperature: 0.5,
    maxTokens: 250,
    modelProvider,
  });

  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);
  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections, {
        onlyContent: true,
      })
    : "No reflections found.";

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  const artifactContent = currentArtifactContent
    ? isArtifactMarkdownContent(currentArtifactContent)
      ? currentArtifactContent.fullMarkdown
      : currentArtifactContent.code
    : undefined;

  const formattedPrompt = FOLLOWUP_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    artifactContent || "No artifacts generated yet."
  )
    .replace("{reflections}", memoriesAsString)
    .replace(
      "{conversation}",
      state.messages
        .map((msg) => `<${msg.getType()}>\n${msg.content}\n</${msg.getType()}>`)
        .join("\n\n")
    );

  // TODO: Include the chat history as well.
  const response = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  return {
    messages: [response],
  };
};
