import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import {
  ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT,
  ADD_LOGS_TO_CODE_ARTIFACT_PROMPT,
  FIX_BUGS_CODE_ARTIFACT_PROMPT,
  PORT_LANGUAGE_CODE_ARTIFACT_PROMPT,
} from "../prompts";

export const rewriteCodeArtifactTheme = async (
  state: typeof OpenCanvasGraphAnnotation.State
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o-mini",
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
      case "html":
        newLanguage = "HTML";
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

  const newArtifactValues = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  const newArtifact = {
    ...selectedArtifact,
    // Ensure the new artifact's language is updated, if necessary
    language: state.portLanguage || selectedArtifact.language,
    content: newArtifactValues.content as string,
  };

  return {
    artifacts: [newArtifact],
  };
};
