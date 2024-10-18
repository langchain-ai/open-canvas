import { ChatOpenAI } from "@langchain/openai";
import { ROUTE_QUERY_PROMPT } from "../prompts";
import { OpenCanvasGraphAnnotation } from "../state";
import { formatArtifacts } from "../utils";
import { z } from "zod";

/**
 * Routes to the proper node in the graph based on the user's query.
 */
export const generatePath = async (
  state: typeof OpenCanvasGraphAnnotation.State
) => {
  if (state.highlighted) {
    return {
      next: "updateArtifact",
      selectedArtifactId: state.highlighted.id,
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

  // Use either the currently selected artifact, or the most recent artifact if no artifact is selected.
  const selectedArtifact = state.selectedArtifactId
    ? state.artifacts.find(
        (artifact) => artifact.id === state.selectedArtifactId
      )
    : state.artifacts[state.artifacts.length - 1];
  const allArtifactsButSelected = state.artifacts.filter(
    (a) => a.id !== state.selectedArtifactId
  );

  // Call model and decide if we need to respond to a users query, or generate a new artifact
  const formattedPrompt = ROUTE_QUERY_PROMPT.replace(
    "{recentMessages}",
    state.messages
      .slice(-3)
      .map((message) => `${message._getType()}: ${message.content}`)
      .join("\n\n")
  )
    .replace(
      "{artifacts}",
      allArtifactsButSelected.length
        ? formatArtifacts(allArtifactsButSelected, true)
        : "No artifacts found."
    )
    .replace(
      "{selectedArtifact}",
      selectedArtifact
        ? formatArtifacts([selectedArtifact], true)
        : "No artifacts found."
    );

  const modelWithTool = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  }).withStructuredOutput(
    z.object({
      route: z.enum(["updateArtifact", "respondToQuery", "generateArtifact"]),
      artifactId: z
        .string()
        .optional()
        .describe("The ID of the artifact to update, if applicable."),
    }),
    {
      name: "route_query",
    }
  );

  const result = await modelWithTool.invoke([
    {
      role: "user",
      content: formattedPrompt,
    },
  ]);

  if (result.route === "updateArtifact") {
    return {
      // Only route to the `updateArtifact` node if highlighted text is present.
      // Otherwise we need to rewrite the entire artifact.
      next: "rewriteArtifact",
      selectedArtifactId: result.artifactId,
    };
  } else {
    return {
      next: result.route,
    };
  }
};
