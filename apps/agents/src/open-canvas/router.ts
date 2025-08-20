import { END, Send } from "@langchain/langgraph";
import { DEFAULT_INPUTS } from "@opencanvas/shared/constants";
import { OpenCanvasGraphAnnotation } from "./state";

const routeNode = (state: typeof OpenCanvasGraphAnnotation.State) => {
  if (!state.next) {
    throw new Error("'next' state field not set.");
  }

  const conditionallyGenerateTitle = (state: typeof OpenCanvasGraphAnnotation.State) => {
    // Implementation based on the task requirements or existing logic
    if (state.title) {
      return END;
    } else {
      return "generateTitle";
    }
  };

  return new Send(state.next, {
    ...state,
  });
};

const cleanState = (_: typeof OpenCanvasGraphAnnotation.State) => {
  return {
    ...DEFAULT_INPUTS,
  };
};

export { routeNode, cleanState, conditionallyGenerateTitle };