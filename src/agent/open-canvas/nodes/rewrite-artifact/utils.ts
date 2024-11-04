import { getArtifactContent } from "@/contexts/utils";
import { isArtifactCodeContent } from "@/lib/artifact_content_types";
import { ArtifactCodeV3, ArtifactMarkdownV3 } from "@/types";
import {
  OPTIONALLY_UPDATE_META_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
} from "../../prompts";
import { OpenCanvasGraphAnnotation } from "../../state";
import { ToolCall } from "@langchain/core/messages/tool";

export const validateState = (
  state: typeof OpenCanvasGraphAnnotation.State
) => {
  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;
  if (!currentArtifactContent) {
    throw new Error("No artifact found");
  }

  const recentHumanMessage = state.messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  return { currentArtifactContent, recentHumanMessage };
};

const buildMetaPrompt = (artifactMetaToolCall: ToolCall | undefined) => {
  const titleSection =
    artifactMetaToolCall?.args?.title &&
    artifactMetaToolCall?.args?.type !== "code"
      ? `And its title is (do NOT include this in your response):\n${artifactMetaToolCall.args.title}`
      : "";

  return OPTIONALLY_UPDATE_META_PROMPT.replace(
    "{artifactType}",
    artifactMetaToolCall?.args?.type
  ).replace("{artifactTitle}", titleSection);
};

interface BuildPromptArgs {
  artifactContent: string;
  memoriesAsString: string;
  isNewType: boolean;
  artifactMetaToolCall: ToolCall | undefined;
}

export const buildPrompt = ({
  artifactContent,
  memoriesAsString,
  isNewType,
  artifactMetaToolCall,
}: BuildPromptArgs) => {
  const metaPrompt = isNewType ? buildMetaPrompt(artifactMetaToolCall) : "";

  return UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    artifactContent
  )
    .replace("{reflections}", memoriesAsString)
    .replace("{updateMetaPrompt}", metaPrompt);
};

interface CreateNewArtifactContentArgs {
  artifactType: string;
  state: typeof OpenCanvasGraphAnnotation.State;
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  artifactMetaToolCall: ToolCall | undefined;
  newContent: string;
}

export const createNewArtifactContent = ({
  artifactType,
  state,
  currentArtifactContent,
  artifactMetaToolCall,
  newContent,
}: CreateNewArtifactContentArgs): ArtifactCodeV3 | ArtifactMarkdownV3 => {
  const baseContent = {
    index: state.artifact.contents.length + 1,
    title: artifactMetaToolCall?.args?.title || currentArtifactContent.title,
  };

  if (artifactType === "code") {
    return {
      ...baseContent,
      type: "code",
      language: getLanguage(artifactMetaToolCall, currentArtifactContent),
      code: newContent,
    };
  }

  return {
    ...baseContent,
    type: "text",
    fullMarkdown: newContent,
  };
};

const getLanguage = (
  artifactMetaToolCall: ToolCall | undefined,
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3 // Replace 'any' with proper type
) =>
  artifactMetaToolCall?.args?.programmingLanguage ||
  (isArtifactCodeContent(currentArtifactContent)
    ? currentArtifactContent.language
    : "other");
