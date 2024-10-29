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
