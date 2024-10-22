import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { ArtifactContent } from "@/types";
import "@blocknote/core/fonts/inter.css";
import {
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { Block } from "@blocknote/core";

export interface TextRendererProps {
  artifactContent: ArtifactContent;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  setArtifactContent: (index: number, content: string) => void;
}

export function TextRenderer(props: TextRendererProps) {
  const editor = useCreateBlockNote({});

  // Add state to store selection for later use
  const lastSelectionRef = useRef<{
    text: string;
    selection: {
      blocks: Block[];
    } | null;
  } | null>(null);

  useEffect(() => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();
    if (selectedText && selection) {
      lastSelectionRef.current = {
        text: selectedText,
        selection: {
          blocks: selection.blocks,
        },
      };
    }
  }, [editor.getSelectedText()]);

  const replaceSelectedText = async (newText: string) => {
    if (!lastSelectionRef.current?.selection?.blocks[0]) return;

    const tiptapEditor = editor._tiptapEditor;

    tiptapEditor.commands.insertContent(newText, {
      updateSelection: true,
    });
  };

  const isComposition = useRef(false);
  const onChange = async () => {
    if (isComposition.current) {
      return;
    }
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    props.setArtifactContent(props.artifactContent.index, markdown);
  };

  useEffect(() => {
    (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(
        props.artifactContent.content
      );
      editor.replaceBlocks(editor.document, blocks);
    })();
  }, [props.artifactContent.content, editor]);

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
        onChange={onChange}
        editable={props.isEditing}
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
