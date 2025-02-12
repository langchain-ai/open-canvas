import { createClient } from "@/hooks/utils";
import { StreamConfig } from "./streamWorker.types";

// Since workers can't directly access the client SDK, you'll need to recreate/import necessary parts
const ctx: Worker = self as any;

ctx.addEventListener("message", async (event: MessageEvent<StreamConfig>) => {
  try {
    const { threadId, assistantId, input, modelName, modelConfigs } =
      event.data;

    const client = createClient();

    const stream = client.runs.stream(threadId, assistantId, {
      input: input as Record<string, unknown>,
      streamMode: "events",
      config: {
        configurable: {
          customModelName: modelName,
          modelConfig: modelConfigs[modelName as keyof typeof modelConfigs],
        },
      },
    });

    for await (const chunk of stream) {
      // Serialize the chunk and post it back to the main thread
      ctx.postMessage({
        type: "chunk",
        data: JSON.stringify(chunk),
      });
    }

    ctx.postMessage({ type: "done" });
  } catch (error: any) {
    ctx.postMessage({
      type: "error",
      error: error.message,
    });
  }
});
