"use client";

import React, { useState } from "react";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { v4 as uuidv4 } from "uuid";
import { MyThread } from "./Primitives";
import { concat } from "@langchain/core/utils/stream";
import { useExternalMessageConverter } from "@assistant-ui/react";
import {
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import {
  convertLangchainMessages,
  convertToOpenAIFormat,
} from "@/lib/convert_messages";
import { GraphInput } from "@/hooks/useGraph";
import { Toaster } from "./ui/toaster";

export interface ContentComposerChatInterfaceProps {
  messages: BaseMessage[];
  streamMessage: (params: GraphInput) => AsyncGenerator<any, void, unknown>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;
}

export function ContentComposerChatInterface(
  props: ContentComposerChatInterfaceProps
): React.ReactElement {
  const { messages, setMessages, streamMessage } = props;
  const [isRunning, setIsRunning] = useState(false);

  async function onNew(message: AppendMessage): Promise<void> {
    if (message.content[0]?.type !== "text") {
      throw new Error("Only text messages are supported");
    }
    setIsRunning(true);

    try {
      const humanMessage = new HumanMessage({
        content: message.content[0].text,
        id: uuidv4(),
      });

      const currentConversation = [...messages, humanMessage];
      setMessages((prevMessages) => [...prevMessages, humanMessage]);

      // Use for...of instead of for await...of for better readability
      for await (const chunk of streamMessage({
        messages: currentConversation.map(convertToOpenAIFormat),
      })) {
        const aiMessageChunk = new AIMessageChunk({
          content: chunk.kwargs.content,
          id: chunk.kwargs.id,
          tool_calls: chunk.kwargs.tool_calls,
          tool_call_chunks: chunk.kwargs.tool_call_chunks,
        });

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];

          // Simplified condition for adding a new message
          if (
            !lastMessage ||
            lastMessage._getType() !== "ai" ||
            lastMessage.id !== aiMessageChunk.id
          ) {
            return [...prevMessages, aiMessageChunk];
          }

          // Concat and replace the last message
          return [
            ...prevMessages.slice(0, -1),
            concat(lastMessage as AIMessageChunk, aiMessageChunk),
          ];
        });
      }
    } catch (error) {
      console.error("Error running message:", error);
    } finally {
      setIsRunning(false);
    }
  }

  const threadMessages = useExternalMessageConverter<BaseMessage>({
    callback: convertLangchainMessages,
    messages: messages,
    isRunning,
  });

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning,
    onNew,
  });

  return (
    <div className="h-full">
      <AssistantRuntimeProvider runtime={runtime}>
        <MyThread />
      </AssistantRuntimeProvider>
      <Toaster />
    </div>
  );
}
