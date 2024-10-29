import { getModelNameAndProviderFromConfig } from "@/agent/utils";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { initChatModel } from "langchain/chat_models/universal";
import { getArtifactContent } from "../../../contexts/utils";
import { isArtifactCodeContent } from "../../../lib/artifact_content_types";
import { ArtifactCodeV3, ArtifactV3 } from "../../../types";
import {
  ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT,
  ADD_LOGS_TO_CODE_ARTIFACT_PROMPT,
  FIX_BUGS_CODE_ARTIFACT_PROMPT,
  PORT_LANGUAGE_CODE_ARTIFACT_PROMPT,
} from "../prompts";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";

export const rewriteCodeArtifactTheme = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const { modelName, modelProvider } =
    getModelNameAndProviderFromConfig(config);
  const smallModel = await initChatModel(modelName, {
    temperature: 0.5,
    modelProvider,
  });

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;
  if (!currentArtifactContent) {
    throw new Error("No artifact found");
  }
  if (!isArtifactCodeContent(currentArtifactContent)) {
    throw new Error("Current artifact content is not code");
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
      case "sql":
        newLanguage = "SQL";
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
    currentArtifactContent.code
  );

  const newArtifactValues = await smallModel.invoke([
    { role: "user", content: formattedPrompt },
  ]);

  const newArtifactContent: ArtifactCodeV3 = {
    index: state.artifact.contents.length + 1,
    type: "code",
    title: currentArtifactContent.title,
    // Ensure the new artifact's language is updated, if necessary
    language: state.portLanguage || currentArtifactContent.language,
    code: newArtifactValues.content as string,
  };

  const newArtifact: ArtifactV3 = {
    ...state.artifact,
    currentIndex: state.artifact.contents.length + 1,
    contents: [...state.artifact.contents, newArtifactContent],
  };

  return {
    artifact: newArtifact,
  };
};
