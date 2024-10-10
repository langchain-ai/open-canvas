import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import {
  ADD_EMOJIS_TO_ARTIFACT_PROMPT,
  CHANGE_ARTIFACT_LANGUAGE_PROMPT,
  CHANGE_ARTIFACT_LENGTH_PROMPT,
  CHANGE_ARTIFACT_READING_LEVEL_PROMPT,
  CHANGE_ARTIFACT_TO_PIRATE_PROMPT,
} from "../prompts";
import { ensureStoreInConfig, formatReflections } from "@/agent/utils";
import { Reflections } from "../../../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const rewriteArtifactTheme = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
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

  let formattedPrompt = "";
  if (state.language) {
    formattedPrompt = CHANGE_ARTIFACT_LANGUAGE_PROMPT.replace(
      "{newLanguage}",
      state.language
    ).replace("{artifactContent}", selectedArtifact.content);
  } else if (state.readingLevel && state.readingLevel !== "pirate") {
    let newReadingLevel = "";
    switch (state.readingLevel) {
      case "child":
        newReadingLevel = "elementary school student";
        break;
      case "teenager":
        newReadingLevel = "high school student";
        break;
      case "college":
        newReadingLevel = "college student";
        break;
      case "phd":
        newReadingLevel = "PhD student";
        break;
    }
    formattedPrompt = CHANGE_ARTIFACT_READING_LEVEL_PROMPT.replace(
      "{newReadingLevel}",
      newReadingLevel
    ).replace("{artifactContent}", selectedArtifact.content);
  } else if (state.readingLevel && state.readingLevel === "pirate") {
    formattedPrompt = CHANGE_ARTIFACT_TO_PIRATE_PROMPT.replace(
      "{artifactContent}",
      selectedArtifact.content
    );
  } else if (state.artifactLength) {
    let newLength = "";
    switch (state.artifactLength) {
      case "shortest":
        newLength = "much shorter than it currently is";
        break;
      case "short":
        newLength = "slightly shorter than it currently is";
        break;
      case "long":
        newLength = "slightly longer than it currently is";
        break;
      case "longest":
        newLength = "much longer than it currently is";
        break;
    }
    formattedPrompt = CHANGE_ARTIFACT_LENGTH_PROMPT.replace(
      "{newLength}",
      newLength
    ).replace("{artifactContent}", selectedArtifact.content);
  } else if (state.regenerateWithEmojis) {
    formattedPrompt = ADD_EMOJIS_TO_ARTIFACT_PROMPT.replace(
      "{artifactContent}",
      selectedArtifact.content
    );
  } else {
    throw new Error("No theme selected");
  }

  formattedPrompt = formattedPrompt.replace("{reflections}", memoriesAsString);

  const newArtifactValues = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  const newArtifact = {
    ...selectedArtifact,
    content: newArtifactValues.content as string,
  };

  return {
    artifacts: [newArtifact],
  };
};
