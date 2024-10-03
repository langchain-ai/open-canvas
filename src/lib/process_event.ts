import React from "react";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { ToolCall } from "@langchain/core/messages/tool";

const processChunk = (
  chunk: Record<string, any> | Record<string, any>[]
): Record<string, any> => {
  if (Array.isArray(chunk)) {
    return chunk[1];
  }
  return chunk;
};

const isChatModelStream = (streamEvent: StreamEvent): boolean => {
  return !!(
    streamEvent.event === "on_chat_model_stream" &&
    processChunk(streamEvent.data.chunk)
  );
};

const isChatModelEnd = (streamEvent: StreamEvent): boolean => {
  return !!(
    streamEvent.event === "on_chat_model_end" && streamEvent.data.output
  );
};

const isWasContentGeneratedNode = (streamEvent: StreamEvent): boolean => {
  return streamEvent.metadata.langgraph_node === "wasContentGenerated";
};

const isCallModelNode = (streamEvent: StreamEvent): boolean => {
  return streamEvent.metadata.langgraph_node === "callModel";
};

const streamEndHasToolCall = (streamEvent: StreamEvent): boolean => {
  return !!(
    streamEvent.data.output.tool_calls &&
    streamEvent.data.output.tool_calls.length > 0
  );
};

const extractMessageId = (streamEvent: StreamEvent): string | undefined => {
  if (isChatModelStream(streamEvent)) {
    return processChunk(streamEvent.data.chunk).id;
  }
  return undefined;
};

function processCallModelStreamEvent(
  streamEvent: StreamEvent
): string | undefined {
  if (isChatModelStream(streamEvent) && isCallModelNode(streamEvent)) {
    return processChunk(streamEvent.data.chunk).content;
  }
  return undefined;
}

function processWasContentGeneratedToolCallEvent(
  streamEvent: StreamEvent
): ToolCall | undefined {
  if (
    isChatModelEnd(streamEvent) &&
    streamEndHasToolCall(streamEvent) &&
    isWasContentGeneratedNode(streamEvent)
  ) {
    return streamEvent.data.output.tool_calls[0];
  }
  return undefined;
}

export async function processStream(
  response: AsyncGenerator<
    {
      event: string;
      data: StreamEvent;
    },
    any,
    unknown
  >,
  extra: {
    setRenderedMessages: (value: React.SetStateAction<BaseMessage[]>) => void;
    setContentGenerated: (value: React.SetStateAction<boolean>) => void;
  }
) {
  const { setRenderedMessages, setContentGenerated } = extra;
  let fullMessage = new AIMessage({
    content: "",
    id: "",
  });

  for await (const chunk of response) {
    try {
      const streamEvent: StreamEvent = chunk.data;
      if (!fullMessage.id) {
        fullMessage.id = extractMessageId(streamEvent) ?? "";
      }

      const newText = processCallModelStreamEvent(streamEvent);
      const toolCall = processWasContentGeneratedToolCallEvent(streamEvent);
      const wasContentGenerated: boolean | undefined =
        toolCall && toolCall.name === "was_content_generated"
          ? toolCall.args.contentGenerated
          : undefined;

      if (newText) {
        fullMessage = new AIMessage({
          id: fullMessage.id,
          content: fullMessage.content + newText,
        });
      } else if (wasContentGenerated) {
        setContentGenerated(true);
        fullMessage = new AIMessage({
          id: fullMessage.id,
          content: fullMessage.content,
          response_metadata: {
            contentGenerated: true,
          },
        });
      } else if (wasContentGenerated === false) {
        // Check for false instead of falsy value to avoid setting contentGenerated to false when it's undefined.
        setContentGenerated(false);
      }

      if (fullMessage.content && fullMessage.id) {
        setRenderedMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];

          if (lastMessage.id === fullMessage.id) {
            const allButLastMessage = prevMessages.slice(0, -1);
            return [...allButLastMessage, fullMessage];
          } else {
            return [...prevMessages, fullMessage];
          }
        });
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  return fullMessage;
}
