import { THINKING_MODELS } from "@/constants";
import { cleanContent } from "@/lib/normalize_string";
import {
  Artifact,
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ArtifactToolResponse,
  ArtifactV3,
  ProgrammingLanguageOptions,
  RewriteArtifactMetaToolResponse,
} from "@/types";
import {
  AIMessage,
  BaseMessage,
  BaseMessageChunk,
} from "@langchain/core/messages";
import { parsePartialJson } from "@langchain/core/output_parsers";
import { Dispatch, SetStateAction } from "react";

export function removeCodeBlockFormatting(text: string): string {
  if (!text) return text;
  // Regular expression to match code blocks
  const codeBlockRegex = /^```[\w-]*\n([\s\S]*?)\n```$/;

  // Check if the text matches the code block pattern
  const match = text.match(codeBlockRegex);

  if (match) {
    // If it matches, return the content inside the code block
    return match[1].trim();
  } else {
    // If it doesn't match, return the original text
    return text;
  }
}

export const replaceOrInsertMessageChunk = (
  prevMessages: BaseMessage[],
  newMessageChunk: BaseMessageChunk
): BaseMessage[] => {
  const existingMessageIndex = prevMessages.findIndex(
    (msg) => msg.id === newMessageChunk.id
  );

  if (
    prevMessages[existingMessageIndex]?.content &&
    typeof prevMessages[existingMessageIndex]?.content !== "string"
  ) {
    throw new Error("Message content is not a string");
  }
  if (typeof newMessageChunk.content !== "string") {
    throw new Error("Message chunk content is not a string");
  }

  if (existingMessageIndex !== -1) {
    // Create a new array with the updated message
    return [
      ...prevMessages.slice(0, existingMessageIndex),
      new AIMessage({
        ...prevMessages[existingMessageIndex],
        content:
          (prevMessages[existingMessageIndex]?.content || "") +
          (newMessageChunk?.content || ""),
      }),
      ...prevMessages.slice(existingMessageIndex + 1),
    ];
  } else {
    const newMessage = new AIMessage({
      ...newMessageChunk,
    });
    return [...prevMessages, newMessage];
  }
};

export const createNewGeneratedArtifactFromTool = (
  artifactTool: ArtifactToolResponse
): ArtifactMarkdownV3 | ArtifactCodeV3 | undefined => {
  if (!artifactTool.type) {
    console.error("Received new artifact without type");
    return;
  }
  if (artifactTool.type === "text") {
    return {
      index: 1,
      type: "text",
      title: artifactTool.title || "",
      fullMarkdown: artifactTool.artifact || "",
    };
  } else {
    if (!artifactTool.language) {
      console.error("Received new code artifact without language");
    }
    return {
      index: 1,
      type: "code",
      title: artifactTool.title || "",
      code: artifactTool.artifact || "",
      language: artifactTool.language as ProgrammingLanguageOptions,
    };
  }
};

const validateNewArtifactIndex = (
  newArtifactIndexGuess: number,
  prevArtifactContentsLength: number,
  isFirstUpdate: boolean
): number => {
  if (isFirstUpdate) {
    // For first updates, currentIndex should be one more than the total prev contents
    // to append the new content at the end
    if (newArtifactIndexGuess !== prevArtifactContentsLength + 1) {
      return prevArtifactContentsLength + 1;
    }
  } else {
    if (newArtifactIndexGuess !== prevArtifactContentsLength) {
      // For subsequent updates, currentIndex should match the total contents
      // to update the latest content in place
      return prevArtifactContentsLength;
    }
  }
  // If the guess is correct, return the guess
  return newArtifactIndexGuess;
};

export const updateHighlightedMarkdown = (
  prevArtifact: ArtifactV3,
  content: string,
  newArtifactIndex: number,
  prevCurrentContent: ArtifactMarkdownV3,
  isFirstUpdate: boolean
): ArtifactV3 | undefined => {
  // Create a deep copy of the previous artifact
  const basePrevArtifact = {
    ...prevArtifact,
    contents: prevArtifact.contents.map((c) => ({ ...c })),
  };

  const currentIndex = validateNewArtifactIndex(
    newArtifactIndex,
    basePrevArtifact.contents.length,
    isFirstUpdate
  );

  let newContents: (ArtifactCodeV3 | ArtifactMarkdownV3)[];

  if (isFirstUpdate) {
    const newMarkdownContent: ArtifactMarkdownV3 = {
      ...prevCurrentContent,
      index: currentIndex,
      fullMarkdown: content,
    };
    newContents = [...basePrevArtifact.contents, newMarkdownContent];
  } else {
    newContents = basePrevArtifact.contents.map((c) => {
      if (c.index === currentIndex) {
        return {
          ...c,
          fullMarkdown: content,
        };
      }
      return { ...c }; // Create new reference for unchanged items too
    });
  }

  // Create new reference for the entire artifact
  const newArtifact: ArtifactV3 = {
    ...basePrevArtifact,
    currentIndex,
    contents: newContents,
  };

  // Verify we're actually creating a new reference
  if (Object.is(newArtifact, prevArtifact)) {
    console.warn("Warning: updateHighlightedMarkdown returned same reference");
  }

  return newArtifact;
};

export const updateHighlightedCode = (
  prevArtifact: ArtifactV3,
  content: string,
  newArtifactIndex: number,
  prevCurrentContent: ArtifactCodeV3,
  isFirstUpdate: boolean
): ArtifactV3 | undefined => {
  // Create a deep copy of the previous artifact
  const basePrevArtifact = {
    ...prevArtifact,
    contents: prevArtifact.contents.map((c) => ({ ...c })),
  };

  const currentIndex = validateNewArtifactIndex(
    newArtifactIndex,
    basePrevArtifact.contents.length,
    isFirstUpdate
  );

  let newContents: (ArtifactCodeV3 | ArtifactMarkdownV3)[];

  if (isFirstUpdate) {
    const newCodeContent: ArtifactCodeV3 = {
      ...prevCurrentContent,
      index: currentIndex,
      code: content,
    };
    newContents = [...basePrevArtifact.contents, newCodeContent];
  } else {
    newContents = basePrevArtifact.contents.map((c) => {
      if (c.index === currentIndex) {
        return {
          ...c,
          code: content,
        };
      }
      return { ...c }; // Create new reference for unchanged items too
    });
  }

  const newArtifact: ArtifactV3 = {
    ...basePrevArtifact,
    currentIndex,
    contents: newContents,
  };

  // Verify we're actually creating a new reference
  if (Object.is(newArtifact, prevArtifact)) {
    console.warn("Warning: updateHighlightedCode returned same reference");
  }

  return newArtifact;
};

interface UpdateRewrittenArtifactArgs {
  prevArtifact: ArtifactV3;
  newArtifactContent: string;
  rewriteArtifactMeta: RewriteArtifactMetaToolResponse;
  prevCurrentContent?: ArtifactMarkdownV3 | ArtifactCodeV3;
  newArtifactIndex: number;
  isFirstUpdate: boolean;
  artifactLanguage: string;
}

export const updateRewrittenArtifact = ({
  prevArtifact,
  newArtifactContent,
  rewriteArtifactMeta,
  prevCurrentContent,
  newArtifactIndex,
  isFirstUpdate,
  artifactLanguage,
}: UpdateRewrittenArtifactArgs): ArtifactV3 => {
  // Create a deep copy of the previous artifact
  const basePrevArtifact = {
    ...prevArtifact,
    contents: prevArtifact.contents.map((c) => ({ ...c })),
  };

  const currentIndex = validateNewArtifactIndex(
    newArtifactIndex,
    basePrevArtifact.contents.length,
    isFirstUpdate
  );

  let artifactContents: (ArtifactMarkdownV3 | ArtifactCodeV3)[];

  if (isFirstUpdate) {
    if (rewriteArtifactMeta.type === "code") {
      artifactContents = [
        ...basePrevArtifact.contents,
        {
          type: "code",
          title: rewriteArtifactMeta.title || prevCurrentContent?.title || "",
          index: currentIndex,
          language: artifactLanguage as ProgrammingLanguageOptions,
          code: newArtifactContent,
        },
      ];
    } else {
      artifactContents = [
        ...basePrevArtifact.contents,
        {
          index: currentIndex,
          type: "text",
          title: rewriteArtifactMeta?.title ?? prevCurrentContent?.title ?? "",
          fullMarkdown: newArtifactContent,
        },
      ];
    }
  } else {
    if (rewriteArtifactMeta?.type === "code") {
      artifactContents = basePrevArtifact.contents.map((c) => {
        if (c.index === currentIndex) {
          return {
            ...c,
            code: newArtifactContent,
          };
        }
        return { ...c }; // Create new reference for unchanged items too
      });
    } else {
      artifactContents = basePrevArtifact.contents.map((c) => {
        if (c.index === currentIndex) {
          return {
            ...c,
            fullMarkdown: newArtifactContent,
          };
        }
        return { ...c }; // Create new reference for unchanged items too
      });
    }
  }

  const newArtifact: ArtifactV3 = {
    ...basePrevArtifact,
    currentIndex,
    contents: artifactContents,
  };

  // Verify we're actually creating a new reference
  if (Object.is(newArtifact, prevArtifact)) {
    console.warn("Warning: updateRewrittenArtifact returned same reference");
  }

  return newArtifact;
};

export const convertToArtifactV3 = (oldArtifact: Artifact): ArtifactV3 => {
  let currentIndex = oldArtifact.currentContentIndex;
  if (currentIndex > oldArtifact.contents.length) {
    // If the value to be set in `currentIndex` is greater than the total number of contents,
    // set it to the last index so that the user can see the latest content.
    currentIndex = oldArtifact.contents.length;
  }

  const v3: ArtifactV3 = {
    currentIndex,
    contents: oldArtifact.contents.map((content) => {
      if (content.type === "code") {
        return {
          index: content.index,
          type: "code",
          title: content.title,
          language: content.language as ProgrammingLanguageOptions,
          code: content.content,
        };
      } else {
        return {
          index: content.index,
          type: "text",
          title: content.title,
          fullMarkdown: content.content,
          blocks: undefined,
        };
      }
    }),
  };
  return v3;
};

export const getArtifactContent = (
  artifact: ArtifactV3
): ArtifactCodeV3 | ArtifactMarkdownV3 => {
  if (!artifact) {
    throw new Error("No artifact found.");
  }
  const currentContent = artifact.contents.find(
    (a) => a.index === artifact.currentIndex
  );
  if (!currentContent) {
    return artifact.contents[artifact.contents.length - 1];
  }
  return currentContent;
};

export function handleGenerateArtifactToolCallChunk(toolCallChunkArgs: string) {
  let newArtifactText: ArtifactToolResponse | undefined = undefined;

  // Attempt to parse the tool call chunk.
  try {
    newArtifactText = parsePartialJson(toolCallChunkArgs);
    if (!newArtifactText) {
      throw new Error("Failed to parse new artifact text");
    }
    newArtifactText = {
      ...newArtifactText,
      title: newArtifactText.title ?? "",
      type: newArtifactText.type ?? "",
    };
  } catch (_) {
    return "continue";
  }

  if (
    newArtifactText.artifact &&
    (newArtifactText.type === "text" ||
      (newArtifactText.type === "code" && newArtifactText.language))
  ) {
    const content = createNewGeneratedArtifactFromTool(newArtifactText);
    if (!content) {
      return undefined;
    }
    if (content.type === "text") {
      content.fullMarkdown = cleanContent(content.fullMarkdown);
    }

    return {
      currentIndex: 1,
      contents: [content],
    };
  }
}

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
