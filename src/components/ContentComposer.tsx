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
import { Artifact, ProgrammingLanguageOptions, Reflections } from "@/types";
import { Thread } from "@langchain/langgraph-sdk";

export interface ContentComposerChatInterfaceProps {
  messages: BaseMessage[];
  streamMessage: (input: GraphInput) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;
  setArtifacts: React.Dispatch<React.SetStateAction<Artifact[]>>;
  setSelectedArtifact: (artifactId: string) => void;
  createThread: () => Promise<Thread>;
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
  userThreads: Thread[];
  switchSelectedThread: (thread: Thread) => void;
  deleteThread: (id: string) => Promise<void>;
  getUserThreads: (id: string) => Promise<void>;
  userId: string;
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
        <MyThread
          handleGetReflections={props.handleGetReflections}
          handleDeleteReflections={props.handleDeleteReflections}
          reflections={props.reflections}
          isLoadingReflections={props.isLoadingReflections}
          handleQuickStart={props.handleQuickStart}
          showNewThreadButton={props.showNewThreadButton}
          createThread={props.createThread}
          setSelectedArtifact={props.setSelectedArtifact}
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
