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
  if (typeof message?.content !== "string") {
    throw new Error("Only text messages are supported");
  }

  switch (getMessageType(message)) {
    case "system":
      return {
        role: "system",
        id: message.id,
        content: [{ type: "text", text: message.content }],
      };
    case "human":
      return {
        role: "user",
        id: message.id,
        content: [{ type: "text", text: message.content }],
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
            text: message.content,
          },
        ],
      };
    case "tool":
      return {
        role: "tool",
        toolName: message.name,
        toolCallId: (message as ToolMessage).tool_call_id,
        result: message.content,
      };
    default:
      throw new Error(`Unsupported message type: ${getMessageType(message)}`);
  }
};

export function convertToOpenAIFormat(message: BaseMessage) {
  if (typeof message?.content !== "string") {
    throw new Error("Only text messages are supported");
  }
  switch (getMessageType(message)) {
    case "system":
      return {
        role: "system",
        content: message.content,
      };
    case "human":
      return {
        role: "user",
        content: message.content,
        additional_kwargs: message.additional_kwargs,
      };
    case "ai":
      return {
        role: "assistant",
        content: message.content,
      };
    case "tool":
      return {
        role: "tool",
        toolName: message.name,
        result: message.content,
      };
    default:
      throw new Error(`Unsupported message type: ${getMessageType(message)}`);
  }
}
