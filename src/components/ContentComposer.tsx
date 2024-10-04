"use client";

import React, { useState } from "react";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { v4 as uuidv4 } from "uuid";
import { MyThread } from "./Primitives";
import { useExternalMessageConverter } from "@assistant-ui/react";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  convertLangchainMessages,
  convertToOpenAIFormat,
} from "@/lib/convert_messages";
import { GraphInput } from "@/hooks/useGraph";
import { Toaster } from "./ui/toaster";
import { Artifact } from "@/types";

export interface ContentComposerChatInterfaceProps {
  messages: BaseMessage[];
  streamMessage: (input: GraphInput) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;
  setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
}

const realNewline = `
`;

export function ContentComposerChatInterface(
  props: ContentComposerChatInterfaceProps
): React.ReactElement {
  const { messages, setMessages, streamMessage } = props;
  const [isRunning, setIsRunning] = useState(false);
  const [generationData, setGenerationData] = useState({
    artifactId: "",
    fullArtifactGenerationStr: "",
  });

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

      await streamMessage({
        messages: currentConversation.map(convertToOpenAIFormat),
      });
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
