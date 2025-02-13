import {
  ROUTE_QUERY_PROMPT,
  ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS,
  ROUTE_QUERY_OPTIONS_NO_ARTIFACTS,
  CURRENT_ARTIFACT_PROMPT,
  NO_ARTIFACT_PROMPT,
} from "../../prompts.js";
import { OpenCanvasGraphAnnotation } from "../../state.js";
import {
  formatArtifactContentWithTemplate,
  getModelFromConfig,
  createContextDocumentMessages,
} from "../../../utils.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import z from "zod";
import { BaseMessage } from "@langchain/core/messages";
import { traceable } from "langsmith/traceable";

interface DynamicDeterminePathParams {
  state: typeof OpenCanvasGraphAnnotation.State;
  newMessages: BaseMessage[];
  config: LangGraphRunnableConfig;
}

/**
 * Dynamically determines the path to take using an LLM.
 */
async function dynamicDeterminePathFunc({
  state,
  newMessages,
  config,
}: DynamicDeterminePathParams) {
  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{artifactOptions}",
    currentArtifactContent
      ? ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS
      : ROUTE_QUERY_OPTIONS_NO_ARTIFACTS
  )
    .replace(
      "{recentMessages}",
      state._messages
        .slice(-3)
        .map((message) => `${message.getType()}: ${message.content}`)
        .join("\n\n")
    )
    .replace(
      "{currentArtifactPrompt}",
      currentArtifactContent
        ? formatArtifactContentWithTemplate(
            CURRENT_ARTIFACT_PROMPT,
            currentArtifactContent
          )
        : NO_ARTIFACT_PROMPT
    );

  const artifactRoute = currentArtifactContent
    ? "rewriteArtifact"
    : "generateArtifact";

  const model = await getModelFromConfig(config, {
    temperature: 0,
    isToolCalling: true,
  });

  const schema = z.object({
    route: z
      .enum(["replyToGeneralInput", artifactRoute])
      .describe("The route to take based on the user's query."),
  });

  const modelWithTool = model.bindTools(
    [
      {
        name: "route_query",
        description: "The route to take based on the user's query.",
        schema,
      },
    ],
    {
      tool_choice: "route_query",
    }
  );

  const contextDocumentMessages = await createContextDocumentMessages(config);
  const result = await modelWithTool.invoke([
    ...contextDocumentMessages,
    ...(newMessages.length ? newMessages : []),
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  return result.tool_calls?.[0]?.args as z.infer<typeof schema> | undefined;
}

export const dynamicDeterminePath = traceable(dynamicDeterminePathFunc, {
  name: "dynamic_determine_path",
});
