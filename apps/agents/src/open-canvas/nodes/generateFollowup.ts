import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getModelFromConfigLocal } from "../../lib/model-config.local";
import { getArtifactContent, isArtifactMarkdownContent } from "@opencanvas/shared/utils/artifacts";
import { Reflections } from "@opencanvas/shared/types";
import { ensureStoreInConfig } from "../../lib/reflections";
import { formatReflections } from "../reflection";
import { BaseMessage } from "@langchain/core/messages";
import { FOLLOWUP_ARTIFACT_PROMPT } from "../prompts";
import { GENERATE_FOLLOWUP_TOOL_SCHEMA } from "./schemas";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../state";

export const generateFollowup = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModelWithTool = (await getModelFromConfigLocal())
    .bindTools([GENERATE_FOLLOWUP_TOOL_SCHEMA], {
      tool_choice: "generate_followup",
    })
    .withConfig({ runName: "generate_followup_model_call" });

  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);
  const memoriesAsString: string = memories?.value
    ? formatReflections(memories.value as Reflections)
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
      state._messages
        .map((msg: BaseMessage) => `<${msg.getType()}>\n${msg.content}\n</${msg.getType()}>`)
        .join("\n\n")
    );

  const response = await smallModelWithTool.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  return {
    messages: [response],
    _messages: [response],
  };
};
