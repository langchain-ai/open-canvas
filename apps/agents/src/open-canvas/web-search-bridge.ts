import { createAIMessageFromWebResults } from "../lib/web-results";
import { OpenCanvasGraphAnnotation } from "./state";
import { Send, Command } from "@langchain/langgraph";

function routePostWebSearch(
  state: typeof OpenCanvasGraphAnnotation.State
): Send | Command {
  const includesArtifacts = state.artifact?.contents?.length > 1;
  if (!state.webSearchResults?.length) {
    return new Send(
      includesArtifacts ? "rewriteArtifact" : "generateArtifact",
      {
        ...state,
        webSearchEnabled: false,
      }
    );
  }

  const webSearchResultsMessage = createAIMessageFromWebResults(
    state.webSearchResults
  );

  return new Command({
    goto: includesArtifacts ? "rewriteArtifact" : "generateArtifact",
    update: {
      webSearchEnabled: false,
      messages: [webSearchResultsMessage],
      _messages: [webSearchResultsMessage],
    },
  });
}

export { routePostWebSearch };
