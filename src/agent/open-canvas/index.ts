import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { DEFAULT_INPUTS } from "../../constants";
import { customAction } from "./nodes/customAction";
import { generateArtifact } from "./nodes/generateArtifact";
import { generateFollowup } from "./nodes/generateFollowup";
import { generatePath } from "./nodes/generatePath";
import { reflectNode } from "./nodes/reflect";
import { respondToQuery } from "./nodes/respondToQuery";
import { rewriteArtifact } from "./nodes/rewriteArtifact";
import { rewriteArtifactTheme } from "./nodes/rewriteArtifactTheme";
import { rewriteCodeArtifactTheme } from "./nodes/rewriteCodeArtifactTheme";
import { titleNode } from "./nodes/title";
import { updateArtifact } from "./nodes/updateArtifact";
import { updateHighlightedText } from "./nodes/updateHighlightedText";
import { OpenCanvasGraphAnnotation } from "./state";

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
    ...DEFAULT_INPUTS,
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
  .addNode("updateHighlightedText", updateHighlightedText)
  .addNode("generateArtifact", generateArtifact)
  .addNode("customAction", customAction)
  .addNode("generateFollowup", generateFollowup)
  .addNode("cleanState", cleanState)
  .addNode("reflect", reflectNode)
  .addNode("title", titleNode)
  // Initial router
  .addConditionalEdges("generatePath", routeNode, [
    "updateArtifact",
    "rewriteArtifactTheme",
    "rewriteCodeArtifactTheme",
    "respondToQuery",
    "generateArtifact",
    "rewriteArtifact",
    "customAction",
    "updateHighlightedText",
  ])
  // Edges
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("updateHighlightedText", "generateFollowup")
  .addEdge("rewriteArtifact", "generateFollowup")
  .addEdge("rewriteArtifactTheme", "generateFollowup")
  .addEdge("rewriteCodeArtifactTheme", "generateFollowup")
  .addEdge("customAction", "generateFollowup")
  // End edges
  .addEdge("respondToQuery", "cleanState")
  // Only reflect if an artifact was generated/updated.
  .addEdge("generateFollowup", "reflect")
  .addEdge("reflect", "cleanState")
  .addEdge("cleanState", "title")
  .addEdge("title", END);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });
