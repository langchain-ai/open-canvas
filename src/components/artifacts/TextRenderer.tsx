import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { ArtifactMarkdownV3, ArtifactV3, TextHighlight } from "@/types";
import "@blocknote/core/fonts/inter.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { isArtifactMarkdownContent } from "@/lib/artifact_content_types";

const cleanText = (text: string) => {
  return text.replaceAll("\\\n", "\n");
};

export interface TextRendererProps {
  isEditing: boolean;
  artifact: ArtifactV3 | undefined;
  setArtifact: Dispatch<SetStateAction<ArtifactV3 | undefined>>;
  setSelectedBlocks: Dispatch<SetStateAction<TextHighlight | undefined>>;
  isStreaming: boolean;
  isInputVisible: boolean;
  updateRenderedArtifactRequired: boolean;
  setUpdateRenderedArtifactRequired: Dispatch<SetStateAction<boolean>>;
  firstTokenReceived: boolean;
}

export function TextRenderer(props: TextRendererProps) {
  const editor = useCreateBlockNote({});

  const [manuallyUpdatingArtifact, setManuallyUpdatingArtifact] =
    useState(false);

  useEffect(() => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();

    if (selectedText && selection) {
      if (!props.artifact) {
        console.error("Artifact not found");
        return;
      }

      const currentBlockIdx = props.artifact.currentIndex;
      const currentContent = props.artifact.contents.find(
        (c) => c.index === currentBlockIdx
      );
      if (!currentContent) {
        console.error("Current content not found");
        return;
      }
      if (!isArtifactMarkdownContent(currentContent)) {
        console.error("Current content is not markdown");
        return;
      }

      (async () => {
        const [markdownBlock, fullMarkdown] = await Promise.all([
          editor.blocksToMarkdownLossy(selection.blocks),
          editor.blocksToMarkdownLossy(editor.document),
        ]);
        props.setSelectedBlocks({
          fullMarkdown: cleanText(fullMarkdown),
          markdownBlock: cleanText(markdownBlock),
          selectedText: cleanText(selectedText),
        });
      })();
    }
  }, [editor.getSelectedText()]);

  useEffect(() => {
    if (!props.isInputVisible) {
      props.setSelectedBlocks(undefined);
    }
  }, [props.isInputVisible]);

  useEffect(() => {
    if (!props.artifact) {
      return;
    }
    if (
      !props.isStreaming &&
      !manuallyUpdatingArtifact &&
      !props.updateRenderedArtifactRequired
    ) {
      console.error("Can only update via useEffect when streaming");
      return;
    }

    try {
      const currentIndex = props.artifact.currentIndex;
      const currentContent = props.artifact.contents.find(
        (c) => c.index === currentIndex && c.type === "text"
      ) as ArtifactMarkdownV3 | undefined;
      if (!currentContent) return;

      // Blocks are not found in the artifact, so once streaming is done we should update the artifact state with the blocks
      (async () => {
        const markdownAsBlocks = await editor.tryParseMarkdownToBlocks(
          currentContent.fullMarkdown
        );
        editor.replaceBlocks(editor.document, markdownAsBlocks);
        props.setUpdateRenderedArtifactRequired(false);
        setManuallyUpdatingArtifact(false);
      })();
    } finally {
      setManuallyUpdatingArtifact(false);
      props.setUpdateRenderedArtifactRequired(false);
    }
  }, [props.artifact, props.updateRenderedArtifactRequired]);

  const isComposition = useRef(false);

  const onChange = async () => {
    if (
      props.isStreaming ||
      manuallyUpdatingArtifact ||
      props.updateRenderedArtifactRequired
    )
      return;

    const fullMarkdown = await editor.blocksToMarkdownLossy(editor.document);
    props.setArtifact((prev) => {
      if (!prev) {
        return {
          currentIndex: 1,
          contents: [
            {
              index: 1,
              fullMarkdown: fullMarkdown,
              title: "Untitled",
              type: "text",
            },
          ],
        };
      } else {
        return {
          ...prev,
          contents: prev.contents.map((c) => {
            if (c.index === prev.currentIndex) {
              return {
                ...c,
                fullMarkdown: fullMarkdown,
              };
            }
            return c;
          }),
        };
      }
    });
  };

  return (
    <div className="w-full h-full mt-2 flex flex-col border-t-[1px] border-gray-200 overflow-y-auto py-5">
      <style jsx global>{`
        .pulse-text .bn-block-group {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
      <BlockNoteView
        theme="light"
        formattingToolbar={false}
        slashMenu={false}
        onCompositionStartCapture={() => (isComposition.current = true)}
        onCompositionEndCapture={() => (isComposition.current = false)}
        onChange={onChange}
        editable={
          !props.isStreaming || props.isEditing || !manuallyUpdatingArtifact
        }
        editor={editor}
        className={
          props.isStreaming && !props.firstTokenReceived ? "pulse-text" : ""
        }
      >
        <SuggestionMenuController
          getItems={async () =>
            getDefaultReactSlashMenuItems(editor).filter(
              (z) => z.group !== "Media"
            )
          }
          triggerCharacter={"/"}
        />
      </BlockNoteView>
    </div>
  );
}
