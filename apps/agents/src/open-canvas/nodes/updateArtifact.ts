import { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  getArtifactContent,
  isArtifactCodeContent,
} from "@opencanvas/shared/utils/artifacts";
import {
  ArtifactCodeV3,
  ArtifactV3,
  Reflections,
} from "@opencanvas/shared/types";
import {
  createContextDocumentMessages,
  ensureStoreInConfig,
  formatReflections,
  getModelConfig,
  getModelFromConfig,
  isUsingO1MiniModel,
} from "../../utils.js";
import { UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT } from "../prompts.js";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../state.js";

/**
 * Update an existing artifact based on the user's query.
 */
export const updateArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const { modelProvider, modelName } = getModelConfig(config);
  let smallModel: Awaited<ReturnType<typeof getModelFromConfig>>;
  if (modelProvider.includes("openai") || modelName.includes("3-5-sonnet")) {
    // Custom model is intelligent enough for updating artifacts
    smallModel = await getModelFromConfig(config, {
      temperature: 0,
    });
  } else {
    // Custom model is not intelligent enough for updating artifacts
    smallModel = await getModelFromConfig(
      {
        ...config,
        configurable: {
          customModelName: "gpt-4o",
        },
      },
      {
        temperature: 0,
      }
    );
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

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;
  if (!currentArtifactContent) {
    throw new Error("No artifact found");
  }
  if (!isArtifactCodeContent(currentArtifactContent)) {
    throw new Error("Current artifact content is not markdown");
  }

  if (!state.highlightedCode) {
    throw new Error(
      "Can not partially regenerate an artifact without a highlight"
    );
  }

  // Highlighted text is present, so we need to update the highlighted text.
  const start = Math.max(0, state.highlightedCode.startCharIndex - 500);
  const end = Math.min(
    currentArtifactContent.code.length,
    state.highlightedCode.endCharIndex + 500
  );

  const beforeHighlight = currentArtifactContent.code.slice(
    start,
    state.highlightedCode.startCharIndex
  ) as string;
  const highlightedText = currentArtifactContent.code.slice(
    state.highlightedCode.startCharIndex,
    state.highlightedCode.endCharIndex
  ) as string;
  const afterHighlight = currentArtifactContent.code.slice(
    state.highlightedCode.endCharIndex,
    end
  ) as string;

  const formattedPrompt = UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT.replace(
    "{highlightedText}",
    highlightedText
  )
    .replace("{beforeHighlight}", beforeHighlight)
    .replace("{afterHighlight}", afterHighlight)
    .replace("{reflections}", memoriesAsString);

  const recentHumanMessage = state._messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  const contextDocumentMessages = await createContextDocumentMessages(config);
  const isO1MiniModel = isUsingO1MiniModel(config);
  const updatedArtifact = await smallModel.invoke([
    { role: isO1MiniModel ? "user" : "system", content: formattedPrompt },
    ...contextDocumentMessages,
    recentHumanMessage,
  ]);

  const entireTextBefore = currentArtifactContent.code.slice(
    0,
    state.highlightedCode.startCharIndex
  );
  const entireTextAfter = currentArtifactContent.code.slice(
    state.highlightedCode.endCharIndex
  );
  const entireUpdatedContent = `${entireTextBefore}${updatedArtifact.content}${entireTextAfter}`;

  const newArtifactContent: ArtifactCodeV3 = {
    ...currentArtifactContent,
    index: state.artifact.contents.length + 1,
    code: entireUpdatedContent,
  };

  const newArtifact: ArtifactV3 = {
    ...state.artifact,
    currentIndex: state.artifact.contents.length + 1,
    contents: [...state.artifact.contents, newArtifactContent],
  };

  return {
    artifact: newArtifact,
  };
};
