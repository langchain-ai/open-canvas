import { useEffect, useRef, useState } from "react";
import { ArtifactMarkdownV3 } from "@/types";
import "@blocknote/core/fonts/inter.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { isArtifactMarkdownContent } from "@/lib/artifact_content_types";
import { CopyText } from "./components/CopyText";
import { getArtifactContent } from "@/contexts/utils";
import { useGraphContext } from "@/contexts/GraphContext";
import React from "react";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const cleanText = (text: string) => {
  return text.replaceAll("\\\n", "\n");
};

export interface TextRendererProps {
  isEditing: boolean;
  isHovering: boolean;
  isInputVisible: boolean;
}

export function TextRendererComponent(props: TextRendererProps) {
  const editor = useCreateBlockNote({});
  const { graphData } = useGraphContext();
  const {
    artifact,
    isStreaming,
    updateRenderedArtifactRequired,
    firstTokenReceived,
    setArtifact,
    setSelectedBlocks,
    setUpdateRenderedArtifactRequired,
  } = graphData;

  const [rawMarkdown, setRawMarkdown] = useState("");
  const [isRawView, setIsRawView] = useState(false);
  const [manuallyUpdatingArtifact, setManuallyUpdatingArtifact] =
    useState(false);

  useEffect(() => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();

    if (selectedText && selection) {
      if (!artifact) {
        console.error("Artifact not found");
        return;
      }

      const currentBlockIdx = artifact.currentIndex;
      const currentContent = artifact.contents.find(
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
        setSelectedBlocks({
          fullMarkdown: cleanText(fullMarkdown),
          markdownBlock: cleanText(markdownBlock),
          selectedText: cleanText(selectedText),
        });
      })();
    }
  }, [editor.getSelectedText()]);

  useEffect(() => {
    if (!props.isInputVisible) {
      setSelectedBlocks(undefined);
    }
  }, [props.isInputVisible]);

  useEffect(() => {
    if (!artifact) {
      return;
    }
    if (
      !isStreaming &&
      !manuallyUpdatingArtifact &&
      !updateRenderedArtifactRequired
    ) {
      console.error("Can only update via useEffect when streaming");
      return;
    }

    try {
      const currentIndex = artifact.currentIndex;
      const currentContent = artifact.contents.find(
        (c) => c.index === currentIndex && c.type === "text"
      ) as ArtifactMarkdownV3 | undefined;
      if (!currentContent) return;

      // Blocks are not found in the artifact, so once streaming is done we should update the artifact state with the blocks
      (async () => {
        const markdownAsBlocks = await editor.tryParseMarkdownToBlocks(
          currentContent.fullMarkdown
        );
        editor.replaceBlocks(editor.document, markdownAsBlocks);
        setUpdateRenderedArtifactRequired(false);
        setManuallyUpdatingArtifact(false);
      })();
    } finally {
      setManuallyUpdatingArtifact(false);
      setUpdateRenderedArtifactRequired(false);
    }
  }, [artifact, updateRenderedArtifactRequired]);

  useEffect(() => {
    if (isRawView) {
      editor.blocksToMarkdownLossy(editor.document).then(setRawMarkdown);
    }
  }, [isRawView, editor]);

  const isComposition = useRef(false);

  const onChange = async () => {
    if (
      isStreaming ||
      manuallyUpdatingArtifact ||
      updateRenderedArtifactRequired
    )
      return;

    const fullMarkdown = await editor.blocksToMarkdownLossy(editor.document);
    setArtifact((prev) => {
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
    <div className="w-full h-full mt-2 flex flex-col border-t-[1px] border-gray-200 overflow-y-auto py-5 relative">
      {props.isHovering && artifact && (
        <div className="absolute top-2 right-4 z-10">
          <CopyText currentArtifactContent={getArtifactContent(artifact)} />
          <TooltipIconButton
            tooltip={"Toggle Markdown View"}
            variant="ghost"
            delayDuration={400}
            onClick={() => setIsRawView((p) => !p)}
            className={cn(
              "transition-colors w-fit h-fit p-2",
              isRawView && "bg-gray-100 text-gray-900"
            )}
          >
            <Eye className="w-6 h-6 text-gray-600" />
          </TooltipIconButton>
        </div>
      )}
      {isRawView ? (
        <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
          {rawMarkdown}
        </pre>
      ) : (
        <>
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
              !isStreaming || props.isEditing || !manuallyUpdatingArtifact
            }
            editor={editor}
            className={isStreaming && !firstTokenReceived ? "pulse-text" : ""}
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
        </>
      )}
    </div>
  );
}

export const TextRenderer = React.memo(TextRendererComponent);
