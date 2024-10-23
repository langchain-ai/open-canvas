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

export const updateHighlightedMarkdown = (
  prevArtifact: ArtifactV3,
  content: string,
  newArtifactIndex: number,
  prevCurrentContent: ArtifactMarkdownV3,
  isFirstUpdate: boolean
): ArtifactV3 | undefined => {
  let newContents: (ArtifactCodeV3 | ArtifactMarkdownV3)[];

  if (isFirstUpdate) {
    const newMarkdownContent: ArtifactMarkdownV3 = {
      ...prevCurrentContent,
      index: newArtifactIndex,
      fullMarkdown: content,
    };
    newContents = [...prevArtifact.contents, newMarkdownContent];
  } else {
    newContents = prevArtifact.contents.map((c) => {
      if (c.index === newArtifactIndex) {
        return {
          ...c,
          fullMarkdown: content,
        };
      }
      return c;
    });
  }

  return {
    ...prevArtifact,
    currentIndex: newArtifactIndex,
    contents: newContents,
  };
};

export const updateHighlightedCode = (
  prevArtifact: ArtifactV3,
  content: string,
  newArtifactIndex: number,
  prevCurrentContent: ArtifactCodeV3,
  isFirstUpdate: boolean
): ArtifactV3 | undefined => {
  let newContents: (ArtifactCodeV3 | ArtifactMarkdownV3)[];

  if (isFirstUpdate) {
    const newCodeContent: ArtifactCodeV3 = {
      ...prevCurrentContent,
      index: newArtifactIndex,
      code: content,
    };
    newContents = [...prevArtifact.contents, newCodeContent];
  } else {
    newContents = prevArtifact.contents.map((c) => {
      if (c.index === newArtifactIndex) {
        return {
          ...c,
          code: content,
        };
      }
      return c;
    });
  }

  return {
    ...prevArtifact,
    currentIndex: newArtifactIndex,
    contents: newContents,
  };
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
  let artifactContents: (ArtifactMarkdownV3 | ArtifactCodeV3)[] = [];

  if (isFirstUpdate) {
    if (rewriteArtifactMeta.type === "code") {
      artifactContents = [
        ...prevArtifact.contents,
        {
          type: "code",
          title: rewriteArtifactMeta.title || prevCurrentContent?.title || "",
          index: newArtifactIndex,
          language: artifactLanguage as ProgrammingLanguageOptions,
          code: newArtifactContent,
        },
      ];
    } else {
      artifactContents = [
        ...prevArtifact.contents,
        {
          index: newArtifactIndex,
          type: "text",
          title: rewriteArtifactMeta?.title ?? prevCurrentContent?.title ?? "",
          fullMarkdown: newArtifactContent,
        },
      ];
    }
  } else {
    if (rewriteArtifactMeta?.type === "code") {
      artifactContents = prevArtifact.contents.map((c) => {
        if (c.index === newArtifactIndex) {
          return {
            ...c,
            code: newArtifactContent,
          };
        }
        return c;
      });
    } else {
      artifactContents = prevArtifact.contents.map((c) => {
        if (c.index === newArtifactIndex) {
          return {
            ...c,
            fullMarkdown: newArtifactContent,
          };
        }
        return c;
      });
    }
  }

  return {
    ...prevArtifact,
    currentIndex: newArtifactIndex,
    contents: artifactContents,
  };
};

export const convertToArtifactV3 = (oldArtifact: Artifact): ArtifactV3 => {
  const v3: ArtifactV3 = {
    currentIndex: oldArtifact.currentContentIndex,
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
  artifact: ArtifactV3 | undefined
): ArtifactCodeV3 | ArtifactMarkdownV3 => {
  const currentContent = artifact?.contents?.find(
    (a) => a.index === artifact.currentIndex
  );
  if (!currentContent) {
    throw new Error("Current content not found.");
  }
  return currentContent;
};
