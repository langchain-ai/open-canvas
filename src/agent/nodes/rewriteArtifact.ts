import { ChatOpenAI } from "@langchain/openai";
import { GraphAnnotation, GraphReturnType } from "../state";
import { UPDATE_ENTIRE_ARTIFACT_PROMPT } from "../prompts";
import { Artifact } from "../../types";

export const rewriteArtifact = async (
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

  const formattedPrompt = UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    selectedArtifact.content
  );

  const recentHumanMessage = state.messages.findLast(
    (message) => message._getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }
  const newArtifactValues = await smallModel.invoke([
    { role: "system", content: formattedPrompt },
    recentHumanMessage,
  ]);

  const newArtifact = {
    ...selectedArtifact,
    content: newArtifactValues.content as string,
  };

  return {
    artifacts: [newArtifact],
    selectedArtifactId: undefined,
    highlighted: undefined,
    language: undefined,
    artifactLength: undefined,
    regenerateWithEmojis: undefined,
    readingLevel: undefined,
  };
};
