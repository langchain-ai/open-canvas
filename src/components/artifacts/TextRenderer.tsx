import { cleanContent } from "@/lib/normalize_string";
import { Artifact } from "@/types";
import { Dispatch, SetStateAction, useEffect } from "react";

import "@blocknote/core/fonts/inter.css";
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
 
export interface TextRenderer {
  artifact: Artifact;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  setArtifactContent: (id: string, content: string) => void;
}

export function TextRenderer(props: TextRenderer) {
  const editor = useCreateBlockNote({});

  const onChange = async () => {
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    props.setArtifactContent(props.artifact.id, cleanContent(markdown));
  };

  useEffect(() => {
    (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(
        props.artifact.content
      );
      editor.replaceBlocks(editor.document, blocks);
    })();
  }, [props.artifact.content , editor]);

  const editorSelectionChange = editor.onEditorSelectionChange(() => {
    const selectedText = editor.getSelectedText();
    console.log("editorSelectionChange", selectedText);
  });

  const getSelection = editor.getSelection();
  console.log("getSelection", getSelection);
  return (
    <div
      className="w-full h-full mt-2 flex flex-col border-[1px] border-gray-200 rounded-2xl overflow-hidden py-5"
      data-color-mode="light"
    >
      <BlockNoteView
        slashMenu={false}
        onCompositionEnd={onChange}
        editable={props.isEditing}
        editor={editor}
        onSelectionChange={() => {
          // Use this to get the selected text for highlighting feature.
          const selectedText = editor.getSelectedText();
          console.log(selectedText);
        }}
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
