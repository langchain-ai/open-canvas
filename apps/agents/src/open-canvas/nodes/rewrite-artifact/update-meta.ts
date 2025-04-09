import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "../../state.js";
import {
  formatArtifactContent,
  getModelFromConfig,
  isUsingO1MiniModel,
} from "../../../utils.js";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { GET_TITLE_TYPE_REWRITE_ARTIFACT } from "../../prompts.js";
import { OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA } from "./schemas.js";
import { z } from "zod";
import { getReflections } from "../../../stores/reflections.js";

export async function optionallyUpdateArtifactMeta(
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<z.infer<typeof OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA>> {
  const toolCallingModel = (
    await getModelFromConfig(config, {
      isToolCalling: true,
    })
  )
    .withStructuredOutput(
      OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA,

      {
        name: "optionallyUpdateArtifactMeta",
      }
    )
    .withConfig({ runName: "optionally_update_artifact_meta" });

  const reflections = await getReflections(config.store, {
    assistantId: config.configurable?.assistant_id,
    userId: config.configurable?.user_id,
  });

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
    ).replace("{reflections}", reflections);

  const recentHumanMessage = state._messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  const isO1MiniModel = isUsingO1MiniModel(config);
  const optionallyUpdateArtifactResponse = await toolCallingModel.invoke([
    {
      role: isO1MiniModel ? "user" : "system",
      content: optionallyUpdateArtifactMetaPrompt,
    },
    recentHumanMessage,
  ]);

  return optionallyUpdateArtifactResponse;
}
