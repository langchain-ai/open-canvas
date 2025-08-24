// A minimal, test-only builder for a trimmed open_canvas graph.
import { StateGraph } from "@langchain/langgraph";

type SmokeState = { step?: string };

export function makeOpenCanvasGraphForSmoke() {
  const builder = new StateGraph<SmokeState>({ channels: {} })
    .addNode("noop", async (s: SmokeState) => ({ ...s, step: "done" }))
    .addEdge("__start__", "noop")
    .addEdge("noop", "__end__");

  return builder.compile().withConfig({ runName: "open_canvas_smoke" });
}