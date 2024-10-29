"use client";

import { useGraph } from "@/hooks/use-graph/useGraph";
import { useToast } from "@/hooks/use-toast";
import {
  convertLangchainMessages,
  convertToOpenAIFormat,
} from "@/lib/convert_messages";
import { ProgrammingLanguageOptions } from "@/types";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Thread } from "./Primitives";
import { Toaster } from "./ui/toaster";
import { useThread } from "@/hooks/useThread";

export interface ContentComposerChatInterfaceProps {
  switchSelectedThreadCallback: (thread: ThreadType) => void;
  setChatStarted: React.Dispatch<React.SetStateAction<boolean>>;
  hasChatStarted: boolean;
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
}

export function ContentComposerChatInterface(
  props: ContentComposerChatInterfaceProps
): React.ReactElement {
  const { toast } = useToast();
  const { messages, setMessages, streamMessage } = useGraph();
  const { getUserThreads } = useThread();
  const [isRunning, setIsRunning] = useState(false);

  async function onNew(message: AppendMessage): Promise<void> {
    if (message.content?.[0]?.type !== "text") {
      toast({
        title: "Only text messages are supported",
        variant: "destructive",
      });
      return;
    }
    props.setChatStarted(true);
    setIsRunning(true);

    try {
      const humanMessage = new HumanMessage({
        content: message.content[0].text,
        id: uuidv4(),
      });

      setMessages((prevMessages) => [...prevMessages, humanMessage]);

      await streamMessage({
        messages: [convertToOpenAIFormat(humanMessage)],
      });
    } finally {
      setIsRunning(false);
      // Re-fetch threads so that the current thread's title is updated.
      await getUserThreads();
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
        <Thread
          setChatStarted={props.setChatStarted}
          handleQuickStart={props.handleQuickStart}
          hasChatStarted={props.hasChatStarted}
          switchSelectedThreadCallback={props.switchSelectedThreadCallback}
        />
      </AssistantRuntimeProvider>
      <Toaster />
    </div>
  );
}
