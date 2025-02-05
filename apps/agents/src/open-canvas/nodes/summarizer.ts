import { Client } from "@langchain/langgraph-sdk";
import { OpenCanvasGraphAnnotation } from "../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export async function summarizer(
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
) {
  if (!config.configurable?.thread_id) {
    throw new Error("Missing thread_id in summarizer config.");
  }

  const client = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  const { thread_id } = await client.threads.create();
  await client.runs.create(thread_id, "summarizer", {
    input: {
      messages: state._messages,
      threadId: config.configurable.thread_id,
    },
  });

  return {};
}
