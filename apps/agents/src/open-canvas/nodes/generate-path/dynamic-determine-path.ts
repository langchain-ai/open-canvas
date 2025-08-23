import {
  ROUTE_QUERY_PROMPT,
  ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS,
  ROUTE_QUERY_OPTIONS_NO_ARTIFACTS,
  CURRENT_ARTIFACT_PROMPT,
  NO_ARTIFACT_PROMPT,
} from "../../prompts.js";
import { OpenCanvasGraphAnnotation } from "../../state.js";
import { createContextDocumentMessagesOpenAI as createContextDocumentMessages } from "../../../lib/context-docs";
import { getModelFromConfigLocal } from "../../../lib/model-config.local";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import z from "zod";
import { BaseMessage } from "@langchain/core/messages";

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
        .map((message: BaseMessage) => `${message.getType()}: ${message.content}`)
        .join("\n\n")
    )
    .replace(
      "{currentArtifactPrompt}",
      currentArtifactContent
        ? CURRENT_ARTIFACT_PROMPT
        : NO_ARTIFACT_PROMPT
    );

  const artifactRoute = currentArtifactContent
    ? "rewriteArtifact"
    : "generateArtifact";

  const model = await getModelFromConfigLocal();

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

  const contextDocumentMessages = await createContextDocumentMessages(state._messages);
  const result = await modelWithTool.invoke([
    ...contextDocumentMessages,
    ...(newMessages.length ? newMessages : []),
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  if (!result.tool_calls || result.tool_calls.length === 0) {
    throw new Error("No tool calls found in the result");
  }
  const args = result.tool_calls[0].args;
  if (!args) {
    throw new Error("No args found in the tool call");
  }
  return args as z.infer<typeof schema>;
}

export const dynamicDeterminePath = dynamicDeterminePathFunc;
