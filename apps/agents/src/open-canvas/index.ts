import { StateGraph, START, END } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "./state";
import { routeNode, cleanState, conditionallyGenerateTitle } from "./router";
import { routePostWebSearch } from "./web-search-bridge";
import { registerArtifactFlow } from "./artifact-flow";
import { customAction } from "./nodes/customAction";
import { generateArtifact } from "./nodes/generate-artifact";
import { generateFollowup } from "./nodes/generateFollowup";
import { generatePath } from "./nodes/generate-path";
import { reflectNode } from "./nodes/reflect";
import { updateArtifact } from "./nodes/updateArtifact";
import { replyToGeneralInput } from "./nodes/replyToGeneralInput";
import { generateTitleNode } from "./nodes/generateTitle";
import { updateHighlightedText } from "./nodes/updateHighlightedText";
import { summarizer } from "./nodes/summarizer";
import { graph as webSearchGraph } from "../web-search";
import { rewriteArtifact } from "./nodes/rewrite-artifact";
import { rewriteArtifactTheme } from "./nodes/rewriteArtifactTheme";
import { rewriteCodeArtifactTheme } from "./nodes/rewriteCodeArtifactTheme";

const builder = new StateGraph(OpenCanvasGraphAnnotation)
  .addNode("customAction", customAction)
  .addNode("generateArtifact", generateArtifact)
  .addNode("generateFollowup", generateFollowup)
  .addNode("generatePath", generatePath)
  .addNode("reflect", reflectNode)
  .addNode("updateArtifact", updateArtifact)
  .addNode("replyToGeneralInput", replyToGeneralInput)
  .addNode("cleanState", cleanState)
  .addNode("cleanStateNode", cleanState)
  .addNode("generateTitle", generateTitleNode)
  .addNode("updateHighlightedText", updateHighlightedText)
  .addNode("summarizer", summarizer)
  .addNode("webSearch", webSearchGraph)
  .addNode("rewriteArtifact", rewriteArtifact)
  .addNode("rewriteArtifactTheme", rewriteArtifactTheme)
  .addNode("rewriteCodeArtifactTheme", rewriteCodeArtifactTheme)
  .addNode("routePostWebSearch", routePostWebSearch)
  .addEdge(START, "generatePath")
  .addEdge("generatePath", "replyToGeneralInput")
  .addConditionalEdges("generatePath", routeNode, [
    "generateArtifact",
    "webSearch",
    "customAction"
  ])
  .addEdge("webSearch", "routePostWebSearch")
  .addEdge("replyToGeneralInput", "cleanState")
  .addEdge("generateArtifact", "reflect")
  .addConditionalEdges("cleanState", conditionallyGenerateTitle, [
    END,
    "generateTitle",
    "summarizer",
  ])
  .addEdge("generateTitle", END)
  .addEdge("summarizer", END)
  .addEdge("generateFollowup", "updateArtifact");

registerArtifactFlow(builder);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });
