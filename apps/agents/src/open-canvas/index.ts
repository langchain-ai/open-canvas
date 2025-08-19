import { Command, END, Send, START, StateGraph } from "@langchain/langgraph";
import { DEFAULT_INPUTS } from "@opencanvas/shared/constants";
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
import { OpenCanvasGraphAnnotation } from "./state";
import { summarizer } from "./nodes/summarizer";
import { graph as webSearchGraph } from "../web-search";
import { rewriteArtifact } from './nodes/rewrite-artifact';
import { BaseMessage } from "@langchain/core/messages";
import { createContextDocumentMessagesOpenAI, mapSearchResultToContextDocument } from "../context-documents";
import { ContextDocument } from "@opencanvas/shared/types";
import { createAIMessageFromWebResults } from '../web-results';

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
const FILE_COUNT_MAX = 3;
const LOC_MAX = 150;

async function countContextDocuments(
  contextDocuments: ContextDocument[]
): Promise<{ fileCount: number; loc: number }> {
  let fileCount = 0;
  let loc = 0;
  for (const doc of contextDocuments) {
    fileCount++;
    if (doc.type === 'code') {
      loc += countLines(doc.data);
    } else {
      loc += countWords(doc.data);
    }
  }
  return { fileCount, loc };
}

function countLines(code: string): number {
  return code.split('\n').length;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

async function shouldSummarize(state: typeof OpenCanvasGraphAnnotation.State): Promise<boolean> {
  const totalChars = state._messages.reduce((acc: number, msg: BaseMessage) => {
    if (typeof msg.content !== "string") {
      const allContent = msg.content.flatMap((c: any) =>
        "text" in c ? (c.text as string) : []
      );
      const totalChars = allContent.reduce((acc: number, c: string) => acc + c.length, 0);
      return acc + totalChars;
    }
    return acc + msg.content.length;
  }, 0);

  const contextDocuments = state.contextDocuments || [];
  const { fileCount, loc } = await countContextDocuments(contextDocuments);

  return totalChars > CHARACTER_MAX || fileCount > FILE_COUNT_MAX || loc > LOC_MAX;
}

// Update the conditional edge to use shouldSummarize
const conditionallyGenerateTitle = async (
  state: typeof OpenCanvasGraphAnnotation.State
): Promise<"generateTitle" | "summarizer" | typeof END> => {
  if (state.messages.length > 2) {
    return (await shouldSummarize(state)) ? "summarizer" : END;
  }
  return "generateTitle";
};

/**
 * Conditionally route to the "generateTitle" node if there are only
 * two messages in the conversation. This node generates a concise title
 * for the conversation which is displayed in the thread history.
 */

/**
 * Updates state & routes the graph based on whether or not the web search
 * graph returned any results.
 */
function routePostWebSearch(
  state: typeof OpenCanvasGraphAnnotation.State
): Send | Command {
  // If there is more than one artifact, then route to the "rewriteArtifact" node. Otherwise, generate the artifact.
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

  // This message is used as a way to reference the web search results in future chats.
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

const builder = new StateGraph(OpenCanvasGraphAnnotation)
  .addNode("generatePath", generatePath)
  .addEdge(START, "generatePath")
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
  .addNode("webSearch", webSearchGraph)
  .addNode("routePostWebSearch", routePostWebSearch)
  .addConditionalEdges("generatePath", routeNode, (state) => {
    const edges = [
      "updateArtifact",
      "rewriteArtifactTheme",
      "rewriteCodeArtifactTheme",
      "replyToGeneralInput",
      "generateArtifact",
      "rewriteArtifact",
      "customAction",
      "updateHighlightedText",
    ];
    if (state.webSearchEnabled) {
      edges.push("webSearch");
    }
    return edges;
  })
  .addEdge("generateArtifact", "generateFollowup")
  .addEdge("updateArtifact", "generateFollowup")
  .addEdge("updateHighlightedText", "generateFollowup")
  .addEdge("rewriteArtifact", "generateFollowup")
  .addEdge("rewriteArtifactTheme", "generateFollowup")
  .addEdge("rewriteCodeArtifactTheme", "generateFollowup")
  .addEdge("customAction", "generateFollowup")
  .addEdge("webSearch", "routePostWebSearch")
  .addEdge("replyToGeneralInput", "cleanState")
  .addEdge("generateFollowup", "reflect")
  .addEdge("reflect", "cleanState")
  .addConditionalEdges("cleanState", conditionallyGenerateTitle, {
    generateTitle: "generateTitle",
    summarizer: "summarizer",
    END: END,
  })
  .addEdge("generateTitle", END)
  .addEdge("summarizer", END);

export const graph = builder.compile().withConfig({ runName: "open_canvas" });
