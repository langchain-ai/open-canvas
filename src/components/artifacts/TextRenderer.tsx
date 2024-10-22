import { v4 as uuidv4 } from "uuid";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { ArtifactContent, ArtifactMarkdownContent, ArtifactV2 } from "@/types";
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
}

export function TextRenderer(props: TextRendererProps) {
  const editor = useCreateBlockNote({});

  useEffect(() => {
    const selectedText = editor.getSelectedText();
    const selection = editor.getSelection();
    console.log("selection", selection);
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
      ).markdownBlocks.filter((b) => {
        const selectedBlockIds = selection.blocks.map((b) => b.id);
        if (selectedBlockIds.includes(b.blockId)) {
          return true;
        }
        return false;
      });
      props.setSelectedBlocks({
        blocks: selectedBlocks,
        selectedText: selectedText,
      });
    }
  }, [editor.getSelectedText()]);

  // const updateSelectedBlocks = async (newTextBlocks: Array<{ blockId: string, newText: string }>) => {
  //   if (!selectedBlocks) return;

  //   selectedBlocks.forEach((block) => {
  //     const newBlockText = newTextBlocks.find((b) => b.blockId === block.id)?.newText;
  //     if (!newBlockText || !block.content) return;
  //     const castBlockContent = block.content as ContentType[];
  //     const updatedBlock = {
  //       ...block,
  //       content: [
  //         {
  //           type: "text",
  //           styles: castBlockContent[0].styles,
  //           text: newBlockText,
  //         }
  //       ]
  //     } as PartialBlock;
  //     editor.updateBlock(block, updatedBlock);
  //   })
  // }

  // const replaceSelectedText = async (newText: string) => {
  //   if (!lastSelectionRef.current?.selection?.blocks[0]) return;

  //   const tiptapEditor = editor._tiptapEditor;

  //   tiptapEditor.commands.insertContent(newText, {
  //     updateSelection: true,
  //   });
  // };

  const isComposition = useRef(false);

  const onChange = async () => {
    if (isComposition.current) {
      return;
    }
    const blockIdsAndMarkdown = await Promise.all(
      editor.document.map(async (doc) => {
        return {
          blockId: doc.id,
          markdown: await editor.blocksToMarkdownLossy([doc]),
          block: doc,
        };
      })
    );

    props.setArtifact_v2((prev) => {
      if (!prev) {
        return {
          id: uuidv4(),
          currentContentIndex: 1,
          contents: [
            {
              index: 1,
              markdownBlocks: blockIdsAndMarkdown,
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
                markdownBlocks: blockIdsAndMarkdown,
              };
            }
            return c;
          }),
        };
      }
    });
  };

  useEffect(() => {
    (async () => {
      console.log("useEffect to update rendered content running!");
      if (!props.artifact_v2?.currentContentIndex) return;
      const newMarkdownBlocks = props.artifact_v2?.contents.find(
        (c) => c.index === props.artifact_v2?.currentContentIndex
      ) as ArtifactMarkdownContent | undefined;
      if (!newMarkdownBlocks) return;
      console.log("found new markdown blocks", newMarkdownBlocks);

      newMarkdownBlocks.markdownBlocks.forEach(async (b) => {
        const existingBlock = editor.getBlock(b.blockId);
        if (existingBlock) {
          console.log("Block exists, updating now.");
          editor.updateBlock(existingBlock, {
            content: b.markdown,
          });
        } else {
          console.log("\n\n\n\nBLOCK DOES NOT EXIST, CREATING NOW\n\n\n\n");
          const blocks = await editor.tryParseMarkdownToBlocks(
            newMarkdownBlocks.markdownBlocks.map((b) => b.markdown).join("\r\n")
          );
          editor.replaceBlocks(editor.document, blocks);
        }
      });

      // const blocks = await editor.tryParseMarkdownToBlocks(
      //   newMarkdownBlocks.markdownBlocks.map((b) => b.markdown).join("\r\n")
      // );
      // editor.replaceBlocks(editor.document, blocks);
    })();
  }, [props.artifact_v2?.currentContentIndex, editor]);

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
