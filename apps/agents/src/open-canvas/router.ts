import { END, Send } from "@langchain/langgraph";
import { DEFAULT_INPUTS } from "@opencanvas/shared/constants";
import { OpenCanvasGraphAnnotation } from "./state";

const CHARACTER_MAX = 300000;   // ~75k tokens x 4 chars
const FILE_COUNT_MAX = 3;
const LOC_MAX = 150;

type CtxDoc = { type: string; data: string };  // minimal shape to avoid extra imports
function countLines(code: string) { return code.split("\n").length; }
function countWords(txt: string) { return txt.trim().split(/\s+/).length; }
function countContextDocuments(contextDocuments: CtxDoc[] = []) {
  let fileCount = 0, loc = 0;
  for (const d of contextDocuments) {
    fileCount++;
    if (d.type === "code") loc += countLines(d.data); else loc += countWords(d.data);
  }
  return { fileCount, loc };
}

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

export function conditionallyGenerateTitle(state: any): "generateTitle" | "summarizer" | typeof END {
  // First exchange? Generate a title early.
  if (Array.isArray(state.messages) && state.messages.length <= 2) return "generateTitle";
  // Character budget across message contents:
  const totalChars = (Array.isArray(state._messages) ? state._messages : [])
    .reduce((acc: number, msg: any) => {
      if (typeof msg?.content === "string") return acc + msg.content.length;
      const parts = Array.isArray(msg?.content) ? msg.content : [];
      const chars = parts.reduce((a, c) => a + (typeof c?.text === "string" ? c.text.length : 0), 0);
      return acc + chars;
    }, 0);
  const { fileCount, loc } = countContextDocuments(state.contextDocuments || []);
  if (totalChars > CHARACTER_MAX || fileCount > FILE_COUNT_MAX || loc > LOC_MAX) return "summarizer";
  return END;
}

export { routeNode, cleanState, conditionallyGenerateTitle };