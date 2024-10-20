import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import {
  GET_TITLE_TYPE_REWRITE_ARTIFACT,
  OPTIONALLY_UPDATE_META_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
} from "../prompts";
import {
  ensureStoreInConfig,
  formatArtifactContent,
  formatReflections,
} from "@/agent/utils";
import { ArtifactContent, Reflections } from "../../../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { z } from "zod";

export const rewriteArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
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
    ? formatReflections(memories.value as Reflections)
    : "No reflections found.";

  let currentArtifactContent: ArtifactContent | undefined;
  if (state.artifact) {
    currentArtifactContent = state.artifact.contents.find(
      (art) => art.index === state.artifact.currentContentIndex
    );
  }
  if (!currentArtifactContent) {
    throw new Error("No current artifact content found");
  }

  const optionallyUpdateArtifactMetaPrompt =
    GET_TITLE_TYPE_REWRITE_ARTIFACT.replace(
      "{artifact}",
      formatArtifactContent(currentArtifactContent, true)
    ).replace("{reflections}", memoriesAsString);

  const recentHumanMessage = state.messages.findLast(
    (message) => message._getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }
  const optionallyUpdateArtifactMetaSchema = z.object({
    type: z
      .enum(["text", "code"])
      .describe("The type of the artifact content."),
    title: z
      .string()
      .optional()
      .describe(
        "The new title to give the artifact. ONLY update this if the user is making a request which changes the subject/topic of the artifact."
      ),
    programmingLanguage: z
      .enum([
        "javascript",
        "typescript",
        "cpp",
        "java",
        "php",
        "python",
        "html",
        "other",
      ])
      .optional()
      .describe(
        "The programming language of the code artifact. ONLY update this if the user is making a request which changes the programming language of the code artifact, or is asking for a code artifact to be generated."
      ),
  });
  const optionallyUpdateModelWithTool = smallModel
    .bindTools([
      {
        name: "optionallyUpdateArtifactMeta",
        schema: optionallyUpdateArtifactMetaSchema,
        description: "Update the artifact meta information, if necessary.",
      },
    ])
    .withConfig({ runName: "optionally_update_artifact_meta" });

  const optionallyUpdateArtifactResponse =
    await optionallyUpdateModelWithTool.invoke([
      { role: "system", content: optionallyUpdateArtifactMetaPrompt },
      recentHumanMessage,
    ]);
  const artifactMetaToolCall = optionallyUpdateArtifactResponse.tool_calls?.[0];
  const isNewType =
    artifactMetaToolCall?.args?.type !== currentArtifactContent.type;

  const formattedPrompt = UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    currentArtifactContent.content
  )
    .replace("{reflections}", memoriesAsString)
    .replace(
      "{updateMetaPrompt}",
      isNewType
        ? OPTIONALLY_UPDATE_META_PROMPT.replace(
            "{artifactType}",
            artifactMetaToolCall?.args?.type
          ).replace(
            "{artifactTitle}",
            artifactMetaToolCall?.args?.title
              ? `And its title should be:\n${artifactMetaToolCall?.args?.title}`
              : ""
          )
        : ""
    );

  const smallModelWithConfig = smallModel.withConfig({
    runName: "rewrite_artifact_model_call",
  });

  const newArtifactContent = await smallModelWithConfig.invoke([
    { role: "system", content: formattedPrompt },
    recentHumanMessage,
  ]);

  const newArtifact = {
    ...state.artifact,
    currentContentIndex: state.artifact.contents.length + 1,
    contents: [
      ...state.artifact.contents,
      {
        index: state.artifact.contents.length + 1,
        content: newArtifactContent.content as string,
        type: artifactMetaToolCall?.args?.type as "text" | "code",
        title:
          artifactMetaToolCall?.args?.title || currentArtifactContent.title,
        language:
          artifactMetaToolCall?.args?.programmingLanguage ||
          currentArtifactContent.language,
      },
    ],
  };

  return {
    artifact: newArtifact,
  };
};
