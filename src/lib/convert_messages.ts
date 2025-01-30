import {
  useExternalMessageConverter,
  ToolCallContentPart,
} from "@assistant-ui/react";
import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";

type Message = useExternalMessageConverter.Message;

export const getMessageType = (message: Record<string, any>): string => {
  if ("getType" in message && typeof message.getType === "function") {
    return message.getType();
  } else if ("_getType" in message && typeof message._getType === "function") {
    return message._getType();
  } else if ("type" in message) {
    return message.type as string;
  } else {
    throw new Error("Unsupported message type");
  }
};

export const convertLangchainMessages: useExternalMessageConverter.Callback<
  BaseMessage
> = (message): Message | Message[] => {
  if (
    typeof message?.content !== "string" &&
    (!Array.isArray(message.content) || message.content[0]?.type !== "text")
  ) {
    console.error(message);
    throw new Error("Only text messages are supported");
  }

  let content = "";
  if (Array.isArray(message.content) && message.content[0]?.type === "text") {
    content = message.content[0].text;
  } else if (typeof message.content === "string") {
    content = message.content;
  }

  switch (getMessageType(message)) {
    case "system":
      return {
        role: "system",
        id: message.id,
        content: [{ type: "text", text: content }],
      };
    case "human":
      return {
        role: "user",
        id: message.id,
        content: [{ type: "text", text: content }],
        ...(message.additional_kwargs
          ? {
              metadata: {
                custom: {
                  ...message.additional_kwargs,
                },
              },
            }
          : {}),
      };
    case "ai":
      const aiMsg = message as AIMessage;
      const toolCallsContent: ToolCallContentPart[] = aiMsg.tool_calls?.length
        ? aiMsg.tool_calls.map((tc) => ({
            type: "tool-call" as const,
            toolCallId: tc.id ?? "",
            toolName: tc.name,
            args: tc.args,
            argsText: JSON.stringify(tc.args),
          }))
        : [];
      return {
        role: "assistant",
        id: message.id,
        content: [
          ...toolCallsContent,
          {
            type: "text",
            text: content,
          },
        ],
      };
    case "tool":
      return {
        role: "tool",
        toolName: message.name,
        toolCallId: (message as ToolMessage).tool_call_id,
        result: content,
      };
    default:
      throw new Error(`Unsupported message type: ${getMessageType(message)}`);
  }
};

export function convertToOpenAIFormat(message: BaseMessage) {
  if (
    typeof message?.content !== "string" &&
    (!Array.isArray(message.content) || message.content[0]?.type !== "text")
  ) {
    throw new Error("Only text messages are supported");
  }

  let content = "";
  if (Array.isArray(message.content) && message.content[0]?.type === "text") {
    content = message.content[0].text;
  } else if (typeof message.content === "string") {
    content = message.content;
  }

  switch (getMessageType(message)) {
    case "system":
      return {
        role: "system",
        content,
      };
    case "human":
      return {
        role: "user",
        content,
        additional_kwargs: message.additional_kwargs,
      };
    case "ai":
      return {
        role: "assistant",
        content,
      };
    case "tool":
      return {
        role: "tool",
        toolName: message.name,
        content,
      };
    default:
      throw new Error(`Unsupported message type: ${getMessageType(message)}`);
  }
}
