import { NEW_ARTIFACT_PROMPT } from "../../prompts.js";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ProgrammingLanguageOptions,
} from "@opencanvas/shared/types";
import { z } from "zod";
import { ARTIFACT_TOOL_SCHEMA } from "./schemas.js";

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
  toolCall: z.infer<typeof ARTIFACT_TOOL_SCHEMA>
): ArtifactCodeV3 | ArtifactMarkdownV3 => {
  const artifactType = toolCall?.type;

  if (artifactType === "code") {
    return {
      index: 1,
      type: "code",
      title: toolCall?.title,
      code: toolCall?.artifact,
      language: toolCall?.language as ProgrammingLanguageOptions,
    };
  }

  return {
    index: 1,
    type: "text",
    title: toolCall?.title,
    fullMarkdown: toolCall?.artifact,
  };
};
