import { v4 as uuidv4 } from "uuid";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import {
  ArtifactContent,
  ArtifactMarkdownContent,
  ArtifactV2,
  MarkdownBlock,
} from "@/types";
import "@blocknote/core/fonts/inter.css";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

export interface TextRendererProps {
  userId: string;
  artifactContent: ArtifactContent;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  setArtifactContent: (index: number, content: string) => void;
  artifact_v2: ArtifactV2 | undefined;
  setArtifact_v2: Dispatch<SetStateAction<ArtifactV2 | undefined>>;
  setSelectedBlocks: Dispatch<
    SetStateAction<
      | {
          blocks: {
            markdown: string;
            blockId: string;
          }[];
          selectedText: string;
        }
      | undefined
    >
  >;
  isStreaming: boolean;
}

export function TextRenderer(props: TextRendererProps) {
  const editor = useCreateBlockNote({});

  useEffect(() => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();

    if (selectedText && selection) {
      if (!props.artifact_v2) {
        console.error("Artifact not found");
        return;
      }
      const currentBlockIdx = props.artifact_v2.currentContentIndex;
      const currentContent = props.artifact_v2.contents.find(
        (c) => c.index === currentBlockIdx
      );
      if (!currentContent) {
        console.error("Current content not found");
        return;
      }

      const selectedBlocks = (
        currentContent as ArtifactMarkdownContent
      ).blocks.filter((b) => {
        const selectedBlockIds = selection.blocks.map((b) => b.id);
        if (selectedBlockIds.includes(b.id)) {
          return true;
        }
        return false;
      });
      props.setSelectedBlocks({
        blocks: selectedBlocks.map((b) => ({
          blockId: b.id,
          markdown: b.content.map((c) => c.text).join(""),
        })),
        selectedText: selectedText,
      });
    }
  }, [editor.getSelectedText()]);

  useEffect(() => {
    if (!props.artifact_v2) {
      return;
    }
    if (!props.isStreaming) {
      console.error("Can only update via useEffect when streaming");
      return;
    }

    const currentIndex = props.artifact_v2.currentContentIndex;
    const currentContent = props.artifact_v2.contents.find(
      (c) => c.index === currentIndex && c.type === "text"
    ) as ArtifactMarkdownContent | undefined;
    if (!currentContent) return;

    currentContent.blocks.forEach((b) => {
      editor.updateBlock(b.id, {
        content: b.content as any[],
        type: b.type as any,
      });
    });
  }, [props.artifact_v2]);

  const isComposition = useRef(false);

  const onChange2 = () => {
    if (props.isStreaming) return;

    const markdownBlocks: MarkdownBlock[] = editor.document.map((doc) => {
      return {
        id: doc.id,
        content: (doc.content as any[]).map((c) => ({
          id: c.id,
          type: c.type,
          text: c.text,
          styles: c.styles,
        })),
        type: doc.type,
      } as MarkdownBlock;
    });

    props.setArtifact_v2((prev) => {
      if (!prev) {
        return {
          id: uuidv4(),
          currentContentIndex: 1,
          contents: [
            {
              index: 1,
              blocks: markdownBlocks,
              title: "Untitled",
              type: "text",
            },
          ],
        };
      } else {
        const currentIndex = prev.currentContentIndex;
        return {
          ...prev,
          contents: prev.contents.map((c) => {
            if (c.index === currentIndex) {
              return {
                ...c,
                blocks: markdownBlocks,
              };
            }
            return c;
          }),
        };
      }
    });
  };

  return (
    <div
      className="w-full h-full mt-2 flex flex-col border-[1px] border-gray-200 rounded-2xl overflow-hidden py-5"
      data-color-mode="light"
    >
      <BlockNoteView
        formattingToolbar={false}
        slashMenu={false}
        onCompositionStartCapture={() => (isComposition.current = true)}
        onCompositionEndCapture={() => (isComposition.current = false)}
        onChange={onChange2}
        editable={!props.isStreaming || props.isEditing}
        editor={editor}
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
