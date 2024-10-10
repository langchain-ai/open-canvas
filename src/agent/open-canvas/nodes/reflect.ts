import { Client } from "@langchain/langgraph-sdk";
import { OpenCanvasGraphAnnotation } from "../state";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const reflectNode = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
) => {
  const langGraphClient = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });
  console.log("reflectNode", state);
  const selectedArtifact = state.selectedArtifactId
    ? state.artifacts.find((art) => art.id === state.selectedArtifactId)
    : state.artifacts[state.artifacts.length - 1];
  const reflectionInput = {
    messages: state.messages,
    artifact: selectedArtifact,
  };
  const reflectionConfig = {
    configurable: {
      // Ensure we pass in the current graph's assistant ID as this is
      // how we fetch & store the memories.
      open_canvas_assistant_id: config.configurable?.assistant_id,
    },
  };

  const newThread = await langGraphClient.threads.create();
  // Create a new reflection run, but do not `wait` for it to finish.
  // Intended to be a background run.
  await langGraphClient.runs.create(newThread.thread_id, "reflection", {
    input: reflectionInput,
    config: reflectionConfig,
  });

  return {};
};
