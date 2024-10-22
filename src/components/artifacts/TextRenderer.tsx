import { v4 as uuidv4 } from "uuid";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import {
  ArtifactCodeContent,
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
import { Block } from "@blocknote/core";

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

  const isComposition = useRef(false);

  const onChange = async () => {
    if (isComposition.current) {
      return;
    }
    console.log("Use effect running");
    const blockIdsAndMarkdown = await Promise.all(
      editor.document.map(async (doc) => {
        const md = await editor.blocksToMarkdownLossy([doc]);
        return {
          blockId: doc.id,
          startingContent: md,
          markdown: md,
          block: doc,
        };
      })
    );

    const currentBlocks = blockIdsAndMarkdown
      .map((b) => editor.getBlock(b.blockId))
      .filter((b): b is Block => !!b)
      .map((b) => ({
        id: b.id,
        content: b.content,
        type: b.type,
      })) as MarkdownBlock[];

    props.setArtifact_v2((prev) => {
      if (!prev) {
        return {
          id: uuidv4(),
          currentContentIndex: 1,
          contents: [
            {
              index: 1,
              blocks: currentBlocks,
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
                blocks: currentBlocks,
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
    async function loadInitialHTML() {
      if (!props.artifact_v2?.currentContentIndex) return;
      const markdownContent = props.artifact_v2.contents.find(
        (c) => c.index === props.artifact_v2?.currentContentIndex
      ) as ArtifactMarkdownContent | undefined;
      if (!markdownContent) return;

      if (markdownContent.blocks.length) {
        markdownContent.blocks.map((b) => {
          console.log("Updating block");
          editor.updateBlock(b.id, {
            content: b.content as any[],
            type: b.type as any,
          });
        });
        return;
      }

      console.log("No blocks found...");
      // let markdownString = markdownContent.blocks?.map((b) => b.content.map((c) => c.text).join("")).join("\r\n");
      // if (!markdownString) {
      //   console.error("No markdown found. Falling back to markdownBlocks");

      // }
      // const blocks = await editor.tryParseMarkdownToBlocks(markdownString);
      // props.setArtifact_v2((prev) => {
      //   if (!prev) return prev;
      //   return {
      //     ...prev,
      //     contents: prev.contents.map((c) => {
      //       if (c.index === prev.currentContentIndex) {
      //         const mdBlocks = blocks.map((b) => ({
      //           id: b.id,
      //           content: b.content,
      //           type: b.type,
      //         })) as MarkdownBlock[];
      //         return {
      //           ...c as ArtifactMarkdownContent,
      //           blocks: mdBlocks
      //         }
      //       }
      //       return c;
      //     })
      //   }
      // })
      // editor.replaceBlocks(editor.document, blocks);
    }
    loadInitialHTML();
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
