"use client";

import React, { useState } from "react";
import {
  AppendMessage,
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { v4 as uuidv4 } from "uuid";
import { MyThread } from "./Primitives";
import { processStream } from "@/lib/process_event";
import { useExternalMessageConverter } from "@assistant-ui/react";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  convertLangchainMessages,
  convertToOpenAIFormat,
} from "@/lib/convert_messages";
import { GraphInput } from "@/hooks/useGraph";
import { Toaster } from "./ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { type Assistant } from "@langchain/langgraph-sdk";

export interface ContentComposerChatInterfaceProps {
  systemRules: string | undefined;
  streamMessage: (params: GraphInput) => Promise<
    AsyncGenerator<
      {
        event: string;
        data: any;
      },
      any,
      unknown
    >
  >;
  sendMessage: (params: GraphInput) => Promise<Record<string, any>>;
  createAssistant: (
    graphId: string,
    userId: string,
    extra?: {
      assistantName?: string;
      assistantDescription?: string;
      overrideExisting?: boolean;
    }
  ) => Promise<Assistant | undefined>;
  userId: string | undefined;
}

export function ContentComposerChatInterface(
  props: ContentComposerChatInterfaceProps
): React.ReactElement {
  const { systemRules, streamMessage, sendMessage } = props;
  // Only messages which are rendered in the UI. This mainly excludes revised messages.
  const [renderedMessages, setRenderedMessages] = useState<BaseMessage[]>([]);
  // Messages which contain revisions are not rendered.
  const [allMessages, setAllMessages] = useState<BaseMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  // Use this state field to determine whether or not to generate insights.
  const [contentGenerated, setContentGenerated] = useState(false);
  const { toast } = useToast();

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
      const currentConversation = [...renderedMessages, humanMessage];

      setRenderedMessages(currentConversation);
      setAllMessages((prevMessages) => [...prevMessages, humanMessage]);

      const response = await streamMessage({
        messages: currentConversation.map(convertToOpenAIFormat),
        hasAcceptedText: false,
        contentGenerated,
        systemRules,
      });

      const fullMessage = await processStream(response, {
        setRenderedMessages,
        setContentGenerated,
      });
      setAllMessages((prevMessages) => [...prevMessages, fullMessage]);
    } catch (error) {
      console.error("Error running message:", error);
    } finally {
      setIsRunning(false);
    }
  }

  /**
   * Handle updating the state values for `renderedMessages` as well as
   * `allMessages` when a message is edited. Then, trigger a new request
   * passing `hasAcceptedText` as true to the API so that rules are generated.
   * Since we're only making the request to generate rules, we don't need to
   * update the rendered messages with the response.
   */
  const onEdit = async (message: AppendMessage): Promise<void> => {
    if (message.content[0]?.type !== "text") {
      throw new Error("Only text messages are supported");
    }
    // Create a new assistant message with the revision
    const newMessage = new AIMessage({
      content: message.content[0].text,
      id: uuidv4(),
    });
    const revisedMessage = new HumanMessage({
      id: newMessage.id,
      content: `REVISED MESSAGE:\n${newMessage.content}`,
    });

    const indexOfMessage = Number(message.parentId) + 1;

    // Updates the rendered message with the revised message
    setRenderedMessages((prevMessages) => [
      ...prevMessages.slice(0, indexOfMessage),
      newMessage,
      ...prevMessages.slice(indexOfMessage + 1),
    ]);

    const currentConversation: BaseMessage[] = [
      ...allMessages.slice(0, indexOfMessage + 1),
      revisedMessage,
      ...allMessages.slice(indexOfMessage + 1),
    ];
    // Insert the revised message directly after the original in the conversation history
    setAllMessages((prevMessages) => [
      ...prevMessages.slice(0, indexOfMessage + 1),
      revisedMessage,
      ...prevMessages.slice(indexOfMessage + 1),
    ]);

    // Do not generate insights if content hasn't been generated
    if (!contentGenerated) return;

    try {
      toast({
        description: (
          <p className="flex items-center">
            Generating rules
            <Loader className="ml-2 h-4 w-4 animate-spin" />
          </p>
        ),
        duration: 10000,
      });
      await sendMessage({
        messages: currentConversation.map(convertToOpenAIFormat),
        hasAcceptedText: true,
        contentGenerated: true,
        systemRules,
      });
      toast({
        title: "Successfully generated rules ✅",
        duration: 2500,
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const threadMessages = useExternalMessageConverter<BaseMessage>({
    callback: convertLangchainMessages,
    messages: renderedMessages,
    isRunning,
  });

  const runtime = useExternalStoreRuntime({
    messages: threadMessages,
    isRunning,
    onNew,
    onEdit,
  });

  return (
    <div className="h-full">
      <AssistantRuntimeProvider runtime={runtime}>
        <MyThread
          onCopy={async () => {
            // Do not generate insights if content hasn't been generated
            if (!contentGenerated) return;
            toast({
              description: (
                <p className="flex items-center">
                  Generating rules
                  <Loader className="ml-2 h-4 w-4 animate-spin" />
                </p>
              ),
              duration: 10000,
            });
            await sendMessage({
              messages: allMessages.map(convertToOpenAIFormat),
              hasAcceptedText: true,
              contentGenerated: true,
              systemRules,
            });
            toast({
              title: "Successfully generated rules ✅",
              duration: 2500,
            });
          }}
        />
      </AssistantRuntimeProvider>
      <Toaster />
    </div>
  );
}
