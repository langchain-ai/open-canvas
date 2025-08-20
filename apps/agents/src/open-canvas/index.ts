import { StateGraph, START, END, Send, Command } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation } from "./state";
import { routeNode, cleanState, conditionallyGenerateTitle } from "./router";
import { routePostWebSearch } from "./web-search-bridge";
import { registerArtifactFlow } from "./artifact-flow";
import { customAction } from "./nodes/customAction";
import { generateArtifact } from "./nodes/generate-artifact";
import { generateFollowup } from "./nodes/generateFollowup";
import { generatePath } from "./nodes/generate-path";
import { reflectNode } from "./nodes/reflect";
import { rewriteArtifactTheme } from "./nodes/rewriteArtifactTheme";
import { updateArtifact } from "./nodes/updateArtifact";
import { replyToGeneralInput } from "./nodes/replyToGeneralInput";
import { rewriteCodeArtifactTheme } from "./nodes/rewriteCodeArtifactTheme";
import { generateTitleNode } from "./nodes/generateTitle";
import { updateHighlightedText } from "./nodes/updateHighlightedText";
import { summarizer } from "./nodes/summarizer";
import { graph as webSearchGraph } from "../web-search";

const builder = new StateGraph(OpenCanvasGraphAnnotation)
  .addNode("customAction", customAction)
  .addNode("generateArtifact", generateArtifact)
  .addNode("generateFollowup", generateFollowup)
  .addNode("generatePath", generatePath)
  .addNode("reflect", reflectNode)
  .addNode("rewriteArtifactTheme", rewriteArtifactTheme)
  .addNode("updateArtifact", updateArtifact)
  .addNode("replyToGeneralInput", replyToGeneralInput)
  .addNode("rewriteCodeArtifactTheme", rewriteCodeArtifactTheme)
  .addNode("generateTitle", generateTitleNode)
  .addNode("updateHighlightedText", updateHighlightedText)
  .addNode("summarizer", summarizer)
  .addNode("webSearch", webSearchGraph)
  .addEdge(START, "generatePath")
  .addConditionalEdges("generatePath", routeNode, ["generateArtifact", "webSearch"])
  .addEdge("webSearch", "routePostWebSearch")
  .addConditionalEdges("routePostWebSearch", routePostWebSearch, ["rewriteArtifact", "generateArtifact"])
  .addEdge("replyToGeneralInput", "cleanState")
  .addConditionalEdges("cleanState", conditionallyGenerateTitle, [END, "generateTitle", "summarizer"])
  .addEdge("generateTitle", END)
  .addEdge("summarizer", END);

registerArtifactFlow(builder);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });
