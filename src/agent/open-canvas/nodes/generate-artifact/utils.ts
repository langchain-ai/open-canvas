import { NEW_ARTIFACT_PROMPT } from "../../prompts";
import { ArtifactCodeV3, ArtifactMarkdownV3 } from "@/types";
import { ToolCall } from "@langchain/core/messages/tool";

export const formatNewArtifactPrompt = (
  memoriesAsString: string,
  modelName: string
): string => {
  return NEW_ARTIFACT_PROMPT.replace("{reflections}", memoriesAsString).replace(
    "{disableChainOfThought}",
    modelName.includes("claude")
      ? "\n\nIMPORTANT: Do NOT preform chain of thought beforehand. Instead, go STRAIGHT to generating the tool response. This is VERY important."
      : ""
  );
};

export const createArtifactContent = (
  toolCall: ToolCall | undefined
): ArtifactCodeV3 | ArtifactMarkdownV3 => {
  const toolArgs = toolCall?.args;
  const artifactType = toolArgs?.type;

  if (artifactType === "code") {
    return {
      index: 1,
      type: "code",
      title: toolArgs?.title,
      code: toolArgs?.artifact,
      language: toolArgs?.language,
    };
  }

  return {
    index: 1,
    type: "text",
    title: toolArgs?.title,
    fullMarkdown: toolArgs?.artifact,
  };
};
