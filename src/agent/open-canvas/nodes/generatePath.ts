import { createModelInstance } from "@/agent/lib";
import { z } from "zod";
import { ArtifactContent } from "../../../types";
import { formatArtifactContentWithTemplate } from "../../utils";
import {
  CURRENT_ARTIFACT_PROMPT,
  NO_ARTIFACT_PROMPT,
  ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS,
  ROUTE_QUERY_OPTIONS_NO_ARTIFACTS,
  ROUTE_QUERY_PROMPT,
} from "../prompts";
import { OpenCanvasGraphAnnotation } from "../state";

/**
 * Routes to the proper node in the graph based on the user's query.
 */
export const generatePath = async (
  state: typeof OpenCanvasGraphAnnotation.State
) => {
  if (state.highlighted) {
    return {
      next: "updateArtifact",
    };
  }

  if (
    state.language ||
    state.artifactLength ||
    state.regenerateWithEmojis ||
    state.readingLevel
  ) {
    return {
      next: "rewriteArtifactTheme",
    };
  }

  if (
    state.addComments ||
    state.addLogs ||
    state.portLanguage ||
    state.fixBugs
  ) {
    return {
      next: "rewriteCodeArtifactTheme",
    };
  }

  let currentArtifactContent: ArtifactContent | undefined;
  if (state.artifact) {
    currentArtifactContent = state.artifact.contents.find(
      (art) => art.index === state.artifact.currentContentIndex
    );
  }

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{artifactOptions}",
    currentArtifactContent
      ? ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS
      : ROUTE_QUERY_OPTIONS_NO_ARTIFACTS
  )
    .replace(
      "{recentMessages}",
      state.messages
        .slice(-3)
        .map((message) => `${message._getType()}: ${message.content}`)
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

  const modelName = state.model ?? "gpt-4o-mini";

  const modelInstance = createModelInstance(modelName, {
    temperature: 0,
  }) as any;

  const modelWithTool = modelInstance.withStructuredOutput(
    z.object({
      route: z
        .enum(["respondToQuery", artifactRoute])
        .describe("The route to take based on the user's query."),
    }),
    {
      name: "route_query",
    }
  );

  // const modelWithTool = new ChatOpenAI({
  //   model: "gpt-4o-mini",
  //   temperature: 0,
  // }).withStructuredOutput(
  //   z.object({
  //     route: z
  //       .enum(["respondToQuery", artifactRoute])
  //       .describe("The route to take based on the user's query."),
  //   }),
  //   {
  //     name: "route_query",
  //   }
  // );

  const result = await modelWithTool.invoke([
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  return {
    next: result.route,
  };
};
