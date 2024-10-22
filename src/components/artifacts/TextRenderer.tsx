import { Dispatch, SetStateAction, useEffect } from "react";

import { ArtifactContent } from "@/types";
import "@blocknote/core/fonts/inter.css";
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";

export interface TextRenderer {
  artifactContent: ArtifactContent;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  setArtifactContent: (index: number, content: string) => void;
}

export function TextRenderer(props: TextRenderer) {
  const editor = useCreateBlockNote({});

  const onChange = async () => {
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
        slashMenu={false}
        onCompositionEnd={onChange}
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
