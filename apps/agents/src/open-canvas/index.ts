import { END, Send, START, StateGraph } from "@langchain/langgraph";
import { DEFAULT_INPUTS } from "@opencanvas/shared/dist/constants";
import { customAction } from "./nodes/customAction.js";
import { generateArtifact } from "./nodes/generate-artifact/index.js";
import { generateFollowup } from "./nodes/generateFollowup.js";
import { generatePath } from "./nodes/generatePath.js";
import { reflectNode } from "./nodes/reflect.js";
import { rewriteArtifact } from "./nodes/rewrite-artifact/index.js";
import { rewriteArtifactTheme } from "./nodes/rewriteArtifactTheme.js";
import { updateArtifact } from "./nodes/updateArtifact.js";
import { replyToGeneralInput } from "./nodes/replyToGeneralInput.js";
import { rewriteCodeArtifactTheme } from "./nodes/rewriteCodeArtifactTheme.js";
import { generateTitleNode } from "./nodes/generateTitle.js";
import { updateHighlightedText } from "./nodes/updateHighlightedText.js";
import { OpenCanvasGraphAnnotation } from "./state.js";
import { summarizer } from "./nodes/summarizer.js";

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

// ~ 4 chars per token, max tokens of 75000. 75000 * 4 = 300000
const CHARACTER_MAX = 300000;

function simpleTokenCalculator(
  state: typeof OpenCanvasGraphAnnotation.State
): "summarizer" | typeof END {
  const totalChars = state._messages.reduce((acc, msg) => {
    if (typeof msg.content !== "string") {
      const allContent = msg.content.flatMap((c) =>
        "text" in c ? (c.text as string) : []
      );
      const totalChars = allContent.reduce((acc, c) => acc + c.length, 0);
      return acc + totalChars;
    }
    return acc + msg.content.length;
  }, 0);

  if (totalChars > CHARACTER_MAX) {
    return "summarizer";
  }
  return END;
}

/**
 * Conditionally route to the "generateTitle" node if there are only
 * two messages in the conversation. This node generates a concise title
 * for the conversation which is displayed in the thread history.
 */
const conditionallyGenerateTitle = (
  state: typeof OpenCanvasGraphAnnotation.State
): "generateTitle" | "summarizer" | typeof END => {
  if (state.messages.length > 2) {
    // Do not generate if there are more than two messages (meaning it's not the first human-AI conversation)
    return simpleTokenCalculator(state);
  }
  return "generateTitle";
};

const builder = new StateGraph(OpenCanvasGraphAnnotation)
  // Start node & edge
  .addNode("generatePath", generatePath)
  .addEdge(START, "generatePath")
  // Nodes
  .addNode("replyToGeneralInput", replyToGeneralInput)
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
  .addNode("generateTitle", generateTitleNode)
  .addNode("summarizer", summarizer)
  // Initial router
  .addConditionalEdges("generatePath", routeNode, [
    "updateArtifact",
    "rewriteArtifactTheme",
    "rewriteCodeArtifactTheme",
    "replyToGeneralInput",
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
  .addEdge("replyToGeneralInput", "cleanState")
  // Only reflect if an artifact was generated/updated.
  .addEdge("generateFollowup", "reflect")
  .addEdge("reflect", "cleanState")
  .addConditionalEdges("cleanState", conditionallyGenerateTitle, [
    END,
    "generateTitle",
    "summarizer",
  ])
  .addEdge("generateTitle", END)
  .addEdge("summarizer", END);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });
