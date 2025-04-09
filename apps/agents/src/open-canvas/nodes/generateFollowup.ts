import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getModelFromConfig } from "../../utils.js";
import {
  getArtifactContent,
  isArtifactMarkdownContent,
} from "@opencanvas/shared/utils/artifacts";
import { FOLLOWUP_ARTIFACT_PROMPT } from "../prompts.js";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../state.js";
import { getReflections } from "../../stores/reflections.js";

/**
 * Generate a followup message after generating or updating an artifact.
 */
export const generateFollowup = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = await getModelFromConfig(config, {
    maxTokens: 250,
    // We say tool calling is true here because that'll cause it to use a small model
    isToolCalling: true,
  });

  const reflections = await getReflections(config.store, {
    assistantId: config.configurable?.assistant_id,
    userId: config.configurable?.supabase_user_id,
  });

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
    .replace("{reflections}", reflections)
    .replace(
      "{conversation}",
      state._messages
        .map((msg) => `<${msg.getType()}>\n${msg.content}\n</${msg.getType()}>`)
        .join("\n\n")
    );

  // TODO: Include the chat history as well.
  const response = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  return {
    messages: [response],
    _messages: [response],
  };
};
