import { useState } from "react";
import { BaseMessage } from "@langchain/core/messages";
import { DEFAULT_MESSAGES } from "@/lib/dummy";

export interface GraphInput {
  messages: Record<string, any>[];
}

export function useGraph() {
  const [messages, setMessages] = useState<BaseMessage[]>(DEFAULT_MESSAGES);

  async function* streamMessage(params: GraphInput) {
    const { messages } = params;

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      try {
        const chunk = decoder.decode(value);
        const parsed = JSON.parse(chunk);
        yield parsed;
      } catch (e) {
        // no-op
      }
    }
  }

  return {
    messages,
    setMessages,
    streamMessage,
  };
}
