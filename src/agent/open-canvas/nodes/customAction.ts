import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import {
  CUSTOM_QUICK_ACTION_ARTIFACT_CONTENT_PROMPT,
  CUSTOM_QUICK_ACTION_ARTIFACT_PROMPT_PREFIX,
  CUSTOM_QUICK_ACTION_CONVERSATION_CONTEXT,
  REFLECTIONS_QUICK_ACTION_PROMPT,
} from "../prompts";
import { ensureStoreInConfig, formatReflections } from "../../utils";
import {
  ArtifactContent,
  CustomQuickAction,
  Reflections,
} from "../../../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const formatMessages = (messages: BaseMessage[]): string =>
  messages
    .map(
      (msg) =>
        `<${msg.getType()}>\n${msg.content as string}\n</${msg.getType()}>`
    )
    .join("\n");

export const customAction = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  if (!state.customQuickActionId) {
    throw new Error("No custom quick action ID found.");
  }

  const smallModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
  });

  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const customActionsNamespace = ["custom_actions", assistantId];
  const actionsKey = "actions";

  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";

  const [customActionsItem, memories] = await Promise.all([
    store.get(customActionsNamespace, actionsKey),
    store.get(memoryNamespace, memoryKey),
  ]);
  if (!customActionsItem?.value) {
    throw new Error("No custom actions found.");
  }
  const customQuickAction = customActionsItem.value[
    state.customQuickActionId
  ] as CustomQuickAction | undefined;
  if (!customQuickAction) {
    throw new Error(
      `No custom quick action found from ID ${state.customQuickActionId}`
    );
  }

  let currentArtifactContent: ArtifactContent | undefined;
  if (state.artifact) {
    currentArtifactContent = state.artifact.contents.find(
      (art) => art.index === state.artifact.currentContentIndex
    );
  }
  if (!currentArtifactContent) {
    throw new Error("No artifact content found.");
  }

  let formattedPrompt = `<custom-instructions>\n${customQuickAction.prompt}\n</custom-instructions>`;
  if (customQuickAction.includeReflections && memories?.value) {
    const memoriesAsString = formatReflections(memories.value as Reflections);
    const reflectionsPrompt = REFLECTIONS_QUICK_ACTION_PROMPT.replace(
      "{reflections}",
      memoriesAsString
    );
    formattedPrompt += `\n\n${reflectionsPrompt}`;
  }

  if (customQuickAction.includePrefix) {
    formattedPrompt = `${CUSTOM_QUICK_ACTION_ARTIFACT_PROMPT_PREFIX}\n\n${formattedPrompt}`;
  }

  if (customQuickAction.includeRecentHistory) {
    const formattedConversationHistory =
      CUSTOM_QUICK_ACTION_CONVERSATION_CONTEXT.replace(
        "{conversation}",
        formatMessages(state.messages.slice(-5))
      );
    formattedPrompt += `\n\n${formattedConversationHistory}`;
  }

  formattedPrompt += `\n\n${CUSTOM_QUICK_ACTION_ARTIFACT_CONTENT_PROMPT.replace("{artifactContent}", currentArtifactContent.content)}`;

  const newArtifactValues = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  const newArtifact = {
    ...state.artifact,
    currentContentIndex: state.artifact.contents.length + 1,
    contents: [
      ...state.artifact.contents,
      {
        ...currentArtifactContent,
        index: state.artifact.contents.length + 1,
        content: newArtifactValues.content as string,
      },
    ],
  };

  return {
    artifact: newArtifact,
  };
};
