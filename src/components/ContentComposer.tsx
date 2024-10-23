"use client";

import React, { useState } from "react";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { v4 as uuidv4 } from "uuid";
import { Thread } from "./Primitives";
import { useExternalMessageConverter } from "@assistant-ui/react";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  convertLangchainMessages,
  convertToOpenAIFormat,
} from "@/lib/convert_messages";
import { GraphInput } from "@/hooks/use-graph/useGraph";
import { Toaster } from "./ui/toaster";
import { ProgrammingLanguageOptions, Reflections } from "@/types";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";
import { useToast } from "@/hooks/use-toast";

export interface ContentComposerChatInterfaceProps {
  messages: BaseMessage[];
  streamMessage: (input: GraphInput) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;
  createThread: () => Promise<ThreadType | undefined>;
  setChatStarted: React.Dispatch<React.SetStateAction<boolean>>;
  showNewThreadButton: boolean;
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  isLoadingReflections: boolean;
  reflections: (Reflections & { updatedAt: Date }) | undefined;
  handleDeleteReflections: () => Promise<boolean>;
  handleGetReflections: () => Promise<void>;
  isUserThreadsLoading: boolean;
  userThreads: ThreadType[];
  switchSelectedThread: (thread: ThreadType) => void;
  deleteThread: (id: string) => Promise<void>;
  getUserThreads: (id: string) => Promise<void>;
  userId: string;
}

export function ContentComposerChatInterface(
  props: ContentComposerChatInterfaceProps
): React.ReactElement {
  const { toast } = useToast();
  const { messages, setMessages, streamMessage } = props;
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
      await props.getUserThreads(props.userId);
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
          handleGetReflections={props.handleGetReflections}
          handleDeleteReflections={props.handleDeleteReflections}
          reflections={props.reflections}
          isLoadingReflections={props.isLoadingReflections}
          handleQuickStart={props.handleQuickStart}
          showNewThreadButton={props.showNewThreadButton}
          createThread={props.createThread}
          isUserThreadsLoading={props.isUserThreadsLoading}
          userThreads={props.userThreads}
          switchSelectedThread={props.switchSelectedThread}
          deleteThread={props.deleteThread}
        />
      </AssistantRuntimeProvider>
      <Toaster />
    </div>
  );
}
