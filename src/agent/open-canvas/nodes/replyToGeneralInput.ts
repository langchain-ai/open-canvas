import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { initChatModel } from "langchain/chat_models/universal";
import { getArtifactContent } from "../../../contexts/utils";
import { Reflections } from "../../../types";
import {
  ensureStoreInConfig,
  formatArtifactContentWithTemplate,
  formatReflections,
  getModelNameAndProviderFromConfig,
} from "../../utils";
import { CURRENT_ARTIFACT_PROMPT, NO_ARTIFACT_PROMPT } from "../prompts";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";

/**
 * Generate responses to questions. Does not generate artifacts.
 */
export const replyToGeneralInput = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const { modelName, modelProvider } =
    getModelNameAndProviderFromConfig(config);
  const smallModel = await initChatModel(modelName, {
    temperature: 0.5,
    modelProvider,
  });

  const prompt = `You are an AI assistant tasked with responding to the users question.
  
The user has generated artifacts in the past. Use the following artifacts as context when responding to the users question.

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{reflections}
</reflections>

{currentArtifactPrompt}`;

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

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

  const formattedPrompt = prompt
    .replace("{reflections}", memoriesAsString)
    .replace(
      "{currentArtifactPrompt}",
      currentArtifactContent
        ? formatArtifactContentWithTemplate(
            CURRENT_ARTIFACT_PROMPT,
            currentArtifactContent
          )
        : NO_ARTIFACT_PROMPT
    );

  const response = await smallModel.invoke([
    { role: "system", content: formattedPrompt },
    ...state.messages,
  ]);

  return {
    messages: [response],
  };
};
