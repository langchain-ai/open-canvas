import { useEffect, useState } from "react";
import { BaseMessage } from "@langchain/core/messages";
import { DEFAULT_MESSAGES } from "@/lib/dummy";
import { useToast } from "./use-toast";
import { createClient } from "./utils";

export interface GraphInput {
  messages: Record<string, any>[];
}

export function useGraph() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (threadId || typeof window === "undefined") return;
    createThread();
  }, []);

  const createThread = async () => {
    const client = createClient();
    console.log("Before req");
    const thread = await client.threads.create();
    console.log("After req");
    setThreadId(thread.thread_id);
    return thread;
  };

  const streamMessage = async (params: GraphInput) => {
    const { messages } = params;
    if (!threadId) {
      toast({
        title: "Error",
        description: "Thread ID not found",
      });
      return undefined;
    }

    const client = createClient();
    const input = { messages };
    return client.runs.stream(threadId, "agent", {
      input,
      streamMode: "events",
    });
  };

  return {
    messages,
    setMessages,
    streamMessage,
  };
}
