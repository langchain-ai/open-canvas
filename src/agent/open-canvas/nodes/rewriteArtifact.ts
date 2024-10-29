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
  getModelNameAndProviderFromConfig,
} from "../../utils";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ArtifactV3,
  PROGRAMMING_LANGUAGES,
  Reflections,
} from "../../../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { z } from "zod";
import { getArtifactContent } from "../../../contexts/utils";
import {
  isArtifactCodeContent,
  isArtifactMarkdownContent,
} from "../../../lib/artifact_content_types";
import { initChatModel } from "langchain/chat_models/universal";

export const rewriteArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
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
    language: z
      .enum(
        PROGRAMMING_LANGUAGES.map((lang) => lang.language) as [
          string,
          ...string[],
        ]
      )
      .describe(
        "The language of the code artifact. This should be populated with the programming language if the user is requesting code to be written, or 'other', in all other cases."
      ),
  });
  const { modelName, modelProvider } =
    getModelNameAndProviderFromConfig(config);
  const toolCallingModel = (
    await initChatModel(modelName, {
      temperature: 0,
      modelProvider,
    })
  )
    .bindTools(
      [
        {
          name: "optionallyUpdateArtifactMeta",
          schema: optionallyUpdateArtifactMetaSchema,
          description: "Update the artifact meta information, if necessary.",
        },
      ],
      { tool_choice: "optionallyUpdateArtifactMeta" }
    )
    .withConfig({ runName: "optionally_update_artifact_meta" });

  const smallModelWithConfig = (
    await initChatModel(modelName, {
      temperature: 0,
      modelProvider,
    })
  ).withConfig({
    runName: "rewrite_artifact_model_call",
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

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;
  if (!currentArtifactContent) {
    throw new Error("No artifact found");
  }

  const optionallyUpdateArtifactMetaPrompt =
    GET_TITLE_TYPE_REWRITE_ARTIFACT.replace(
      "{artifact}",
      formatArtifactContent(currentArtifactContent, true)
    ).replace("{reflections}", memoriesAsString);

  const recentHumanMessage = state.messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  const optionallyUpdateArtifactResponse = await toolCallingModel.invoke([
    { role: "system", content: optionallyUpdateArtifactMetaPrompt },
    recentHumanMessage,
  ]);
  const artifactMetaToolCall = optionallyUpdateArtifactResponse.tool_calls?.[0];
  const artifactType = artifactMetaToolCall?.args?.type;
  const isNewType = artifactType !== currentArtifactContent.type;

  const artifactContent = isArtifactMarkdownContent(currentArtifactContent)
    ? currentArtifactContent.fullMarkdown
    : currentArtifactContent.code;

  const formattedPrompt = UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    artifactContent
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
            artifactMetaToolCall?.args?.title &&
              artifactMetaToolCall?.args?.type !== "code"
              ? `And its title is (do NOT include this in your response):\n${artifactMetaToolCall?.args?.title}`
              : ""
          )
        : ""
    );

  const newArtifactResponse = await smallModelWithConfig.invoke([
    { role: "system", content: formattedPrompt },
    recentHumanMessage,
  ]);

  let newArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  if (artifactType === "code") {
    newArtifactContent = {
      index: state.artifact.contents.length + 1,
      type: "code",
      title: artifactMetaToolCall?.args?.title || currentArtifactContent.title,
      language:
        artifactMetaToolCall?.args?.programmingLanguage ||
        (isArtifactCodeContent(currentArtifactContent)
          ? currentArtifactContent.language
          : "other"),
      code: newArtifactResponse.content as string,
    };
  } else {
    newArtifactContent = {
      index: state.artifact.contents.length + 1,
      type: "text",
      title: artifactMetaToolCall?.args?.title || currentArtifactContent.title,
      fullMarkdown: newArtifactResponse.content as string,
    };
  }

  const newArtifact: ArtifactV3 = {
    ...state.artifact,
    currentIndex: state.artifact.contents.length + 1,
    contents: [...state.artifact.contents, newArtifactContent],
  };

  return {
    artifact: newArtifact,
  };
};
