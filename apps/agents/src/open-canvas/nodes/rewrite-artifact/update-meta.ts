import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "../../state.js";
import { formatArtifactContent, getModelFromConfig } from "../../../utils.js";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { GET_TITLE_TYPE_REWRITE_ARTIFACT } from "../../prompts.js";
import { getFormattedReflections } from "../../../reflection";

export async function optionallyUpdateArtifactMeta(
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<any> {
  const toolCallingModel = await getModelFromConfig(config);

  const memoriesAsString = await getFormattedReflections(config);

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;
  if (!currentArtifactContent) {
    throw new Error("No artifact found");
  }

  const optionallyUpdateArtifactMetaPrompt =
    GET_TITLE_TYPE_REWRITE_ARTIFACT.replace(
      "{artifact}",
      formatArtifactContent(currentArtifactContent, true)
    ).replace("{reflections}", memoriesAsString);

  const recentHumanMessage = state._messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  const optionallyUpdateArtifactResponse = await toolCallingModel.invoke([
    {
      role: "system",
      content: optionallyUpdateArtifactMetaPrompt,
    },
    recentHumanMessage,
  ]);

  return optionallyUpdateArtifactResponse;
}
