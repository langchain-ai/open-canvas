import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { Client } from "@langchain/langgraph-sdk";
import { OpenCanvasGraphAnnotation } from "../state";

export const generateTitleNode = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
) => {
  if (state.messages.length > 2) {
    // Skip if it's not first human ai conversation. Should never occur in practice
    // due to the conditional edge which is called before this node.
    return {};
  }

  const langGraphClient = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
    defaultHeaders: {
      "X-API-KEY": process.env.LANGCHAIN_API_KEY,
    },
  });

  const titleInput = {
    messages: state.messages,
    artifact: state.artifact,
  };
  const titleConfig = {
    configurable: {
      open_canvas_thread_id: config.configurable?.thread_id,
    },
  };

  // Create a new thread for title generation
  const newThread = await langGraphClient.threads.create();

  // Create a new title generation run in the background
  await langGraphClient.runs.create(newThread.thread_id, "thread_title", {
    input: titleInput,
    config: titleConfig,
    multitaskStrategy: "enqueue",
    afterSeconds: 0,
  });

  return {};
};
