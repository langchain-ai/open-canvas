import { createModelInstance } from "@/agent/lib";
import { ArtifactContent } from "../../../types";
import {
  ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT,
  ADD_LOGS_TO_CODE_ARTIFACT_PROMPT,
  FIX_BUGS_CODE_ARTIFACT_PROMPT,
  PORT_LANGUAGE_CODE_ARTIFACT_PROMPT,
} from "../prompts";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";

export const rewriteCodeArtifactTheme = async (
  state: typeof OpenCanvasGraphAnnotation.State
): Promise<OpenCanvasGraphReturnType> => {
  console.log("LOG rewriteCodeArtifactTheme state: ", state);
  console.log("LOG generating model instance with model: ", state.model);
  const model = createModelInstance(state.model ?? "gpt-4o-mini", {
    temperature: 0.5,
  });
  console.log("LOG model generated: ");
  const smallModel = model;

  // const smallModel = new ChatOpenAI({
  //   model: "gpt-4o-mini",
  //   temperature: 0.5,
  // });

  let currentArtifactContent: ArtifactContent | undefined;
  if (state.artifact) {
    currentArtifactContent = state.artifact.contents.find(
      (art) => art.index === state.artifact.currentContentIndex
    );
  }
  if (!currentArtifactContent) {
    throw new Error("No artifact content found.");
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
    currentArtifactContent.content
  );

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
        // Ensure the new artifact's language is updated, if necessary
        language: state.portLanguage || currentArtifactContent.language,
      },
    ],
  };

  return {
    artifact: newArtifact,
  };
};
