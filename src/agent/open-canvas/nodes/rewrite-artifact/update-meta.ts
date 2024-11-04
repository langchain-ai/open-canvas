import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "../../state";
import { formatArtifactContent, getModelFromConfig } from "@/agent/utils";
import { getArtifactContent } from "@/contexts/utils";
import { GET_TITLE_TYPE_REWRITE_ARTIFACT } from "../../prompts";
import { OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA } from "./schemas";
import { ToolCall } from "@langchain/core/messages/tool";
import { getFormattedReflections } from "../../../utils";

export async function optionallyUpdateArtifactMeta(
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<ToolCall | undefined> {
  const toolCallingModel = (await getModelFromConfig(config))
    .bindTools(
      [
        {
          name: "optionallyUpdateArtifactMeta",
          schema: OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA,
          description: "Update the artifact meta information, if necessary.",
        },
      ],
      { tool_choice: "optionallyUpdateArtifactMeta" }
    )
    .withConfig({ runName: "optionally_update_artifact_meta" });

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

  const recentHumanMessage = state.messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  const optionallyUpdateArtifactResponse = await toolCallingModel.invoke([
    { role: "system", content: optionallyUpdateArtifactMetaPrompt },
    recentHumanMessage,
  ]);

  return optionallyUpdateArtifactResponse.tool_calls?.[0];
}
