import type { Dispatch, SetStateAction } from "react";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { THINKING_MODELS } from "../models.js";

type ThinkingAndResponseTokens = {
  thinking: string;
  response: string;
};

/**
 * Extracts thinking and response content from a text string containing XML-style think tags.
 * Designed to handle streaming text where tags might be incomplete.
 *
 * @param text - The input text that may contain <think> tags
 * @returns An object containing:
 *   - thinking: Content between <think> tags, or all content after <think> if no closing tag
 *   - response: All text outside of think tags
 *
 * @example
 * // Complete tags
 * extractThinkingAndResponseTokens('Hello <think>processing...</think>world')
 * // Returns: { thinking: 'processing...', response: 'Hello world' }
 *
 * // Streaming/incomplete tags
 * extractThinkingAndResponseTokens('Hello <think>processing...')
 * // Returns: { thinking: 'processing...', response: 'Hello ' }
 *
 * // No tags
 * extractThinkingAndResponseTokens('Hello world')
 * // Returns: { thinking: '', response: 'Hello world' }
 */
export function extractThinkingAndResponseTokens(
  text: string
): ThinkingAndResponseTokens {
  const thinkStartTag = "<think>";
  const thinkEndTag = "</think>";

  const startIndex = text.indexOf(thinkStartTag);

  // No thinking tag found
  if (startIndex === -1) {
    return {
      thinking: "",
      response: text.trim(),
    };
  }

  const afterStartTag = text.substring(startIndex + thinkStartTag.length);
  const endIndex = afterStartTag.indexOf(thinkEndTag);

  // If no closing tag, all remaining text is thinking
  if (endIndex === -1) {
    return {
      thinking: afterStartTag.trim(),
      response: text.substring(0, startIndex).trim(),
    };
  }

  // We have both opening and closing tags
  const thinking = afterStartTag.substring(0, endIndex).trim();
  const response = (
    text.substring(0, startIndex) +
    afterStartTag.substring(endIndex + thinkEndTag.length)
  ).trim();

  return {
    thinking,
    response,
  };
}

type HandleRewriteArtifactThinkingModelParams = {
  newArtifactContent: string;
  setMessages: Dispatch<SetStateAction<BaseMessage[]>>;
  thinkingMessageId: string;
};

/**
 * Handles the rewriting of artifact content by processing thinking tokens and updating messages state.
 * This function extracts thinking and response tokens from the new artifact content, updates the message
 * state with thinking tokens if present, and returns the response content.
 *
 * @param {Object} params - The parameters for handling artifact rewriting
 * @param {string} params.newArtifactContent - The new content to process for the artifact
 * @param {Dispatch<SetStateAction<BaseMessage[]>>} params.setMessages - State setter function for updating messages
 * @param {string} params.thinkingMessageId - Unique identifier for the thinking message to update or create
 * @returns {string} The extracted response content from the artifact
 */
export function handleRewriteArtifactThinkingModel({
  newArtifactContent,
  setMessages,
  thinkingMessageId,
}: HandleRewriteArtifactThinkingModelParams): string {
  const { thinking, response } =
    extractThinkingAndResponseTokens(newArtifactContent);

  if (thinking.length > 0) {
    setMessages((prevMessages) => {
      if (!thinkingMessageId) {
        console.error("Thinking message not found");
        return prevMessages;
      }

      const prevHasThinkingMsg = prevMessages.some(
        (msg) => msg.id === thinkingMessageId
      );

      const thinkingMessage = new AIMessage({
        id: thinkingMessageId,
        content: thinking,
      });

      if (prevHasThinkingMsg) {
        // The message exists, so replace it
        const newMsgs = prevMessages.map((msg) => {
          if (msg.id !== thinkingMessageId) {
            return msg;
          }
          return thinkingMessage;
        });
        return newMsgs;
      }
      // The message does not yet exist, so create it:
      return [...prevMessages, thinkingMessage];
    });
  }

  return response;
}

export function isThinkingModel(model: string): boolean {
  return THINKING_MODELS.some((m) => m === model);
}
