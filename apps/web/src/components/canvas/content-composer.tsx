"use client";

import { useToast } from "@/hooks/use-toast";
import {
  convertLangchainMessages,
  convertToOpenAIFormat,
} from "@/lib/convert_messages";
import {
  ProgrammingLanguageOptions,
  ContextDocument,
} from "@opencanvas/shared/types";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";
import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Toaster } from "../ui/toaster";
import { Thread } from "@/components/chat-interface";
import { useGraphContext } from "@/contexts/GraphContext";
import {
  CompositeAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { AudioAttachmentAdapter } from "../ui/assistant-ui/attachment-adapters/audio";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { arrayToFileList, convertDocuments } from "@/lib/attachments";
import { VideoAttachmentAdapter } from "../ui/assistant-ui/attachment-adapters/video";
import { useUserContext } from "@/contexts/UserContext";
import { useThreadContext } from "@/contexts/ThreadProvider";
import { PDFAttachmentAdapter } from "../ui/assistant-ui/attachment-adapters/pdf";

export interface ContentComposerChatInterfaceProps {
  switchSelectedThreadCallback: (thread: ThreadType) => void;
  setChatStarted: React.Dispatch<React.SetStateAction<boolean>>;
  hasChatStarted: boolean;
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  chatCollapsed: boolean;
  setChatCollapsed: (c: boolean) => void;
}

export function ContentComposerChatInterfaceComponent(
  props: ContentComposerChatInterfaceProps
): React.ReactElement {
  const { toast } = useToast();
  const userData = useUserContext();
  const { graphData } = useGraphContext();
  const {
    messages,
    setMessages,
    streamMessage,
    setIsStreaming,
    searchEnabled,
  } = graphData;
  const { getUserThreads } = useThreadContext();
  const [isRunning, setIsRunning] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const ffmpegRef = useRef(new FFmpeg());

  async function onNew(message: AppendMessage): Promise<void> {
    // Explicitly check for false and not ! since this does not provide a default value
    // so we should assume undefined is true.
    if (message.startRun === false) return;
    if (!userData.user) {
      toast({
        title: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (message.content?.[0]?.type !== "text") {
      toast({
        title: "Only text messages are supported",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    props.setChatStarted(true);
    setIsRunning(true);
    setIsStreaming(true);

    const contentDocuments: ContextDocument[] = [];
    if (message.attachments) {
      const files = message.attachments
        .map((a) => a.file)
        .filter((f): f is File => f != null);
      const fileList = arrayToFileList(files);
      if (fileList) {
        const documentsResult = await convertDocuments({
          ffmpeg: ffmpegRef.current,
          messageRef,
          documents: fileList,
          userId: userData.user.id,
          toast,
        });
        contentDocuments.push(...documentsResult);
      }
    }

    try {
      const humanMessage = new HumanMessage({
        content: message.content[0].text,
        id: uuidv4(),
        additional_kwargs: {
          documents: contentDocuments,
        },
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
    messages,
    isRunning,
    joinStrategy: "none",
  });

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning,
    onNew,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleTextAttachmentAdapter(),
        new AudioAttachmentAdapter(),
        new VideoAttachmentAdapter(),
        new PDFAttachmentAdapter(),
      ]),
    },
  });

  return (
    <div className="h-full w-full">
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread
          userId={userData?.user?.id}
          setChatStarted={props.setChatStarted}
          handleQuickStart={props.handleQuickStart}
          hasChatStarted={props.hasChatStarted}
          switchSelectedThreadCallback={props.switchSelectedThreadCallback}
          searchEnabled={searchEnabled}
          setChatCollapsed={props.setChatCollapsed}
        />
      </AssistantRuntimeProvider>
      <Toaster />
    </div>
  );
}

export const ContentComposerChatInterface = React.memo(
  ContentComposerChatInterfaceComponent
);
