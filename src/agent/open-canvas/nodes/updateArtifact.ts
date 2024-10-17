import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import { UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT } from "../prompts";
import { ensureStoreInConfig, formatReflections } from "@/agent/utils";
import { Reflections } from "../../../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

/**
 * Update an existing artifact based on the user's query.
 */
export const updateArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
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

  const selectedArtifact = state.artifacts.find(
    (artifact) => artifact.id === state.selectedArtifactId
  );
  if (!selectedArtifact) {
    throw new Error("No artifact found with the selected ID");
  }

  if (!state.highlighted) {
    throw new Error(
      "Can not partially regenerate an artifact without a highlight"
    );
  }

  // Highlighted text is present, so we need to update the highlighted text.
  const start = Math.max(0, state.highlighted.startCharIndex - 500);
  const end = Math.min(
    selectedArtifact.content.length,
    state.highlighted.endCharIndex + 500
  );

  const beforeHighlight = selectedArtifact.content.slice(
    start,
    state.highlighted.startCharIndex
  ) as string;
  const highlightedText = selectedArtifact.content.slice(
    state.highlighted.startCharIndex,
    state.highlighted.endCharIndex
  ) as string;
  const afterHighlight = selectedArtifact.content.slice(
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

  const entireTextBefore = selectedArtifact.content.slice(
    0,
    state.highlighted.startCharIndex
  );
  const entireTextAfter = selectedArtifact.content.slice(
    state.highlighted.endCharIndex
  );
  const entireUpdatedContent = `${entireTextBefore}${updatedArtifact.content}${entireTextAfter}`;
  const newArtifact = {
    ...selectedArtifact,
    content: entireUpdatedContent,
  };

  return {
    artifacts: [newArtifact],
  };
};
