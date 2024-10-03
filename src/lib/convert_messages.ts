import { useExternalMessageConverter } from "@assistant-ui/react";
import { BaseMessage, ToolMessage } from "@langchain/core/messages";

export const convertLangchainMessages: useExternalMessageConverter.Callback<
  BaseMessage
> = (message) => {
  if (typeof message.content !== "string") {
    throw new Error("Only text messages are supported");
  }

  switch (message._getType()) {
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
      return {
        role: "assistant",
        id: message.id,
        content: [
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
      throw new Error(`Unsupported message type: ${message._getType()}`);
  }
};

export function convertToOpenAIFormat(message: BaseMessage) {
  if (typeof message.content !== "string") {
    throw new Error("Only text messages are supported");
  }
  switch (message._getType()) {
    case "system":
      return {
        role: "system",
        content: message.content,
      };
    case "human":
      return {
        role: "user",
        content: message.content,
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
      throw new Error(`Unsupported message type: ${message._getType()}`);
  }
}
