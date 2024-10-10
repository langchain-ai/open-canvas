import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "./state";
import { generatePath } from "./nodes/generatePath";
import { generateFollowup } from "./nodes/generateFollowup";
import { generateArtifact } from "./nodes/generateArtifact";
import { rewriteArtifact } from "./nodes/rewriteArtifact";
import { rewriteArtifactTheme } from "./nodes/rewriteArtifactTheme";
import { updateArtifact } from "./nodes/updateArtifact";
import { respondToQuery } from "./nodes/respondToQuery";
import { rewriteCodeArtifactTheme } from "./nodes/rewriteCodeArtifactTheme";

const defaultInputs: Omit<
  typeof OpenCanvasGraphAnnotation.State,
  "messages" | "artifacts"
> = {
  selectedArtifactId: undefined,
  highlighted: undefined,
  next: undefined,
  language: undefined,
  artifactLength: undefined,
  regenerateWithEmojis: undefined,
  readingLevel: undefined,
  addComments: undefined,
  addLogs: undefined,
  fixBugs: undefined,
  portLanguage: undefined,
};

const routeNode = (state: typeof OpenCanvasGraphAnnotation.State) => {
  if (!state.next) {
    throw new Error("'next' state field not set.");
  }

  return new Send(state.next, {
    ...state,
  });
};

const cleanState = (_: typeof OpenCanvasGraphAnnotation.State) => {
  return {
    ...defaultInputs,
  };
};

const builder = new StateGraph(OpenCanvasGraphAnnotation)
  // Start node & edge
  .addNode("generatePath", generatePath)
  .addEdge(START, "generatePath")
  // Initial router
  .addConditionalEdges("generatePath", routeNode)
  // Nodes
  .addNode("respondToQuery", respondToQuery)
  .addNode("rewriteArtifact", rewriteArtifact)
  .addNode("rewriteArtifactTheme", rewriteArtifactTheme)
  .addNode("rewriteCodeArtifactTheme", rewriteCodeArtifactTheme)
  .addNode("updateArtifact", updateArtifact)
  .addNode("generateArtifact", generateArtifact)
  .addNode("generateFollowup", generateFollowup)
  .addNode("cleanState", cleanState)
  // Edges
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("rewriteArtifact", "generateFollowup")
  .addEdge("rewriteArtifactTheme", "generateFollowup")
  .addEdge("rewriteCodeArtifactTheme", "generateFollowup")
  // End edges
  .addEdge("respondToQuery", "cleanState")
  .addEdge("generateFollowup", "cleanState")
  .addEdge("cleanState", END);

export const graph = builder.compile();
