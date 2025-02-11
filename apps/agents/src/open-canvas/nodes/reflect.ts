import { Client } from "@langchain/langgraph-sdk";
import { OpenCanvasGraphAnnotation } from "../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const reflectNode = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
) => {
  try {
    const langGraphClient = new Client({
      apiUrl: `http://localhost:${process.env.PORT}`,
    });

    const reflectionInput = {
      messages: state._messages,
      artifact: state.artifact,
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
    await langGraphClient.runs.create(
      // We enqueue the memory formation process on the same thread.
      // This means that IF this thread doesn't receive more messages before `afterSeconds`,
      // it will read from the shared state and extract memories for us.
      // If a new request comes in for this thread before the scheduled run is executed,
      // that run will be canceled, and a **new** one will be scheduled once
      // this node is executed again.
      newThread.thread_id,
      // Pass the name of the graph to run.
      "reflection",
      {
        input: reflectionInput,
        config: reflectionConfig,
        // This memory-formation run will be enqueued and run later
        // If a new run comes in before it is scheduled, it will be cancelled,
        // then when this node is executed again, a *new* run will be scheduled
        multitaskStrategy: "enqueue",
        // This lets us "debounce" repeated requests to the memory graph
        // if the user is actively engaging in a conversation. This saves us $$ and
        // can help reduce the occurrence of duplicate memories.
        afterSeconds: 5 * 60, // 5 minutes
      }
    );
  } catch (e) {
    console.error("Failed to start reflection");
  }

  return {};
};
