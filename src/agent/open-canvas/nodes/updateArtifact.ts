import { createModelInstance } from "@/agent/lib";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ArtifactContent, Reflections } from "../../../types";
import { ensureStoreInConfig, formatReflections } from "../../utils";
import { UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT } from "../prompts";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";

/**
 * Update an existing artifact based on the user's query.
 */
export const updateArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = createModelInstance(state.model ?? "gpt-4o-mini", {
    temperature: 0.5,
  });

  // const smallModel = new ChatOpenAI({
  //   model: "gpt-4o",
  //   temperature: 0,
  // });

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
    throw new Error("No artifact content found.");
  }

  if (!state.highlighted) {
    throw new Error(
      "Can not partially regenerate an artifact without a highlight"
    );
  }

  // Highlighted text is present, so we need to update the highlighted text.
  const start = Math.max(0, state.highlighted.startCharIndex - 500);
  const end = Math.min(
    currentArtifactContent.content.length,
    state.highlighted.endCharIndex + 500
  );

  const beforeHighlight = currentArtifactContent.content.slice(
    start,
    state.highlighted.startCharIndex
  ) as string;
  const highlightedText = currentArtifactContent.content.slice(
    state.highlighted.startCharIndex,
    state.highlighted.endCharIndex
  ) as string;
  const afterHighlight = currentArtifactContent.content.slice(
    state.highlighted.endCharIndex,
    end
  ) as string;

  const formattedPrompt = UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT.replace(
    "{highlightedText}",
    highlightedText
  )
    .replace("{beforeHighlight}", beforeHighlight)
    .replace("{afterHighlight}", afterHighlight)
    .replace("{reflections}", memoriesAsString);

  const recentHumanMessage = state.messages.findLast(
    (message) => message._getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }
  const updatedArtifact = await smallModel.invoke([
    { role: "system", content: formattedPrompt },
    recentHumanMessage,
  ]);

  const entireTextBefore = currentArtifactContent.content.slice(
    0,
    state.highlighted.startCharIndex
  );
  const entireTextAfter = currentArtifactContent.content.slice(
    state.highlighted.endCharIndex
  );
  const entireUpdatedContent = `${entireTextBefore}${updatedArtifact.content}${entireTextAfter}`;

  const newArtifact = {
    ...state.artifact,
    currentContentIndex: state.artifact.contents.length + 1,
    contents: [
      ...state.artifact.contents,
      {
        ...currentArtifactContent,
        index: state.artifact.contents.length + 1,
        content: entireUpdatedContent,
      },
    ],
  };

  return {
    artifact: newArtifact,
  };
};
