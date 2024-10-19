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
import { reflectNode } from "./nodes/reflect";

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
  lastNodeName: undefined,
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
  // Nodes
  .addNode("respondToQuery", respondToQuery)
  .addNode("rewriteArtifact", rewriteArtifact)
  .addNode("rewriteArtifactTheme", rewriteArtifactTheme)
  .addNode("rewriteCodeArtifactTheme", rewriteCodeArtifactTheme)
  .addNode("updateArtifact", updateArtifact)
  .addNode("generateArtifact", generateArtifact)
  .addNode("generateFollowup", generateFollowup)
  .addNode("cleanState", cleanState)
  .addNode("reflect", reflectNode)
  // Initial router
  .addConditionalEdges("generatePath", routeNode, [
    "updateArtifact",
    "rewriteArtifactTheme",
    "rewriteCodeArtifactTheme",
    "respondToQuery",
    "generateArtifact",
    "rewriteArtifact",
  ])
  // Edges
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("rewriteArtifact", "generateFollowup")
  .addEdge("rewriteArtifactTheme", "generateFollowup")
  .addEdge("rewriteCodeArtifactTheme", "generateFollowup")
  // End edges
  .addEdge("respondToQuery", "cleanState")
  // Only reflect if an artifact was generated/updated.
  .addEdge("generateFollowup", "reflect")
  .addEdge("reflect", "cleanState")
  .addEdge("cleanState", END);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });
