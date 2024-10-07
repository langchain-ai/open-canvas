import { ChatOpenAI } from "@langchain/openai";
import { GraphAnnotation, GraphReturnType } from "../state";
import {
  ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT,
  ADD_LOGS_TO_CODE_ARTIFACT_PROMPT,
  FIX_BUGS_CODE_ARTIFACT_PROMPT,
  PORT_LANGUAGE_CODE_ARTIFACT_PROMPT,
} from "../prompts";
import { Artifact } from "../../types";

export const rewriteCodeArtifactTheme = async (
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

  let formattedPrompt = "";
  if (state.addComments) {
    formattedPrompt = ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT;
  } else if (state.portLanguage) {
    let newLanguage = "";
    switch (state.portLanguage) {
      case "typescript":
        newLanguage = "TypeScript";
        break;
      case "javascript":
        newLanguage = "JavaScript";
        break;
      case "cpp":
        newLanguage = "C++";
        break;
      case "java":
        newLanguage = "Java";
        break;
      case "php":
        newLanguage = "PHP";
        break;
      case "python":
        newLanguage = "Python";
        break;
    }
    formattedPrompt = PORT_LANGUAGE_CODE_ARTIFACT_PROMPT.replace(
      "{newLanguage}",
      newLanguage
    );
  } else if (state.addLogs) {
    formattedPrompt = ADD_LOGS_TO_CODE_ARTIFACT_PROMPT;
  } else if (state.fixBugs) {
    formattedPrompt = FIX_BUGS_CODE_ARTIFACT_PROMPT;
  } else {
    throw new Error("No theme selected");
  }

  // Insert the code into the artifact placeholder in the prompt
  formattedPrompt = formattedPrompt.replace(
    "{artifactContent}",
    selectedArtifact.content
  );

  const newArtifact = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  // Remove the original artifact message from the history.
  const newArtifacts: Artifact[] = [
    ...state.artifacts.filter(
      (artifact) => artifact.id !== selectedArtifact.id
    ),
    {
      ...selectedArtifact,
      // Ensure the new artifact's language is updated, if necessary
      language: state.portLanguage || selectedArtifact.language,
      content: newArtifact.content as string,
    },
  ];

  return {
    artifacts: newArtifacts,
    selectedArtifactId: undefined,
    highlighted: undefined,
    language: undefined,
    artifactLength: undefined,
    regenerateWithEmojis: undefined,
    readingLevel: undefined,
  };
};
