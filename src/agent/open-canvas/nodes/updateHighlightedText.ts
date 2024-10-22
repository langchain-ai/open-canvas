import { ChatOpenAI } from "@langchain/openai";
// import { ChatAnthropic } from "@langchain/anthropic";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import { ArtifactMarkdownContent } from "../../../types";
import { z } from "zod";

const PROMPT = `You are an expert AI writing assistant, tasked with rewriting some text a user has selected. The text may span across multiple 'blocks'. You should always use the 'update_blocks' tool to update the text in accordance with the user's request.
If the user has selected text that spans across multiple blocks, you should update the text in each block accordingly. The blocks will be joined later on, so you do not need to worry about the formatting of the blocks.

# Selected text
{highlightedText}

# Text blocks
{textBlocks}

Your task is to rewrite the sourounding content to fulfill the users request.
You should NOT change anything EXCEPT the highlighted text. The ONLY instance where you may update the sourounding text is if it is necessary to make the highlighted text make sense.
You should ALWAYS respond with the full, updated text block, including any formatting, e.g newlines, indents, markdown syntax, etc. NEVER add extra syntax or formatting unless the user has specifically requested it.
If you observe partial markdown, this is OKAY because you are only updating a partial piece of the text.

Ensure you reply with the FULL text block, including the updated highlighted text. NEVER include only the updated highlighted text, or additional prefixes or suffixes.`;

const convertBlocksToPromptString = (
  textBlocks: { blockId: string; markdown: string }[]
): string => {
  return textBlocks
    .map(
      (block) =>
        `## Block ID\n${block.blockId}\n## Block text\n${block.markdown}`
    )
    .join("\n\n");
};

const updateBlocksTool = {
  name: "update_blocks",
  description: "Update the selected text in the given block(s)",
  schema: z.object({
    blocks: z
      .array(
        z.object({
          block_id: z.string().describe("The ID of the block to update"),
          new_text: z.string().describe("The entire new text for the block"),
        })
      )
      .describe("The updated blocks"),
  }),
};

/**
 * Update an existing artifact based on the user's query.
 */
export const updateHighlightedText = async (
  state: typeof OpenCanvasGraphAnnotation.State
): Promise<OpenCanvasGraphReturnType> => {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  })
    .bindTools([updateBlocksTool], {
      tool_choice: "update_blocks",
    })
    .withConfig({ runName: "update_highlighted_markdown" });

  let currentArtifactContent: ArtifactMarkdownContent | undefined;
  if (state.artifact_v2) {
    currentArtifactContent = state.artifact_v2.contents.find(
      (art) =>
        art.index === state.artifact_v2.currentContentIndex &&
        art.type === "text"
    ) as ArtifactMarkdownContent | undefined;
  }
  if (!currentArtifactContent) {
    throw new Error("No artifact content found.");
  }

  if (!state.highlighted || !state.highlighted.textData) {
    throw new Error(
      "Can not partially regenerate an artifact without a highlight"
    );
  }

  const { blocks, selectedText } = state.highlighted.textData;
  const formattedPrompt = PROMPT.replace(
    "{highlightedText}",
    selectedText
  ).replace("{textBlocks}", convertBlocksToPromptString(blocks));

  const recentUserMessage = state.messages[state.messages.length - 1];
  if (recentUserMessage.getType() !== "human") {
    throw new Error("Expected a human message");
  }

  // const response = await model.invoke([
  //   {
  //     role: "system",
  //     content: formattedPrompt,
  //   },
  //   recentUserMessage,
  // ]);
  await model.invoke([
    {
      role: "system",
      content: formattedPrompt,
    },
    recentUserMessage,
  ]);

  // const newArtifact: Artifact = {
  //   ...state.artifact,
  //   currentContentIndex: state.artifact.contents.length + 1,
  //   contents: [...state.artifact.contents, {
  //     ...currentArtifactContent,
  //     index: state.artifact.contents.length + 1,
  //     content: currentArtifactContent.content.replace(block, response.content as string),
  //   }],
  // }

  return {
    // artifact: newArtifact,
  };
};
