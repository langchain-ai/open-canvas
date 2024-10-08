import { ChatOpenAI } from "@langchain/openai";
import { GraphAnnotation, GraphReturnType } from "../state";
import { UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT } from "../prompts";
import { newlineToCarriageReturn } from "@/lib/normalize_string";

/**
 * Update an existing artifact based on the user's query.
 */
export const updateArtifact = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
  });

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

  const normalizedString = newlineToCarriageReturn(selectedArtifact.content);

  // Highlighted text is present, so we need to update the highlighted text.
  const start = Math.max(0, state.highlighted.startCharIndex - 500);
  const end = Math.min(
    normalizedString.length,
    state.highlighted.endCharIndex + 500
  );

  const beforeHighlight = normalizedString.slice(
    start,
    state.highlighted.startCharIndex
  ) as string;
  const highlightedText = normalizedString.slice(
    state.highlighted.startCharIndex,
    state.highlighted.endCharIndex
  ) as string;
  const afterHighlight = normalizedString.slice(
    state.highlighted.endCharIndex,
    end
  ) as string;

  const formattedPrompt = UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT.replace(
    "{highlightedText}",
    highlightedText
  )
    .replace("{beforeHighlight}", beforeHighlight)
    .replace("{afterHighlight}", afterHighlight);

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
