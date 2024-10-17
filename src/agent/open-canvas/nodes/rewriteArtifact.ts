import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import { UPDATE_ENTIRE_ARTIFACT_PROMPT } from "../prompts";
import { ensureStoreInConfig, formatReflections } from "@/agent/utils";
import { Reflections } from "../../../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

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

  const selectedArtifact = state.artifacts.find(
    (artifact) => artifact.id === state.selectedArtifactId
  );
  if (!selectedArtifact) {
    throw new Error("No artifact found with the selected ID");
  }

  const formattedPrompt = UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    selectedArtifact.content
  ).replace("{reflections}", memoriesAsString);

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
  };
};
