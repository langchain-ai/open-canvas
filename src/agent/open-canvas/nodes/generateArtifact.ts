import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import { NEW_ARTIFACT_PROMPT } from "../prompts";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ArtifactV3,
  PROGRAMMING_LANGUAGES,
  Reflections,
} from "../../../types";
import { z } from "zod";
import { ensureStoreInConfig, formatReflections } from "../../utils";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

/**
 * Generate a new artifact based on the user's query.
 */
export const generateArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
  });

  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);
  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections)
    : "No reflections found.";

  const modelWithArtifactTool = smallModel.bindTools(
    [
      {
        name: "generate_artifact",
        schema: z.object({
          type: z
            .enum(["code", "text"])
            .describe("The content type of the artifact generated."),
          language: z
            .enum(
              PROGRAMMING_LANGUAGES.map((lang) => lang.language) as [
                string,
                ...string[],
              ]
            )
            .optional()
            .describe(
              "The language/programming language of the artifact generated.\n" +
                "If generating code, it should be one of the options, or 'other'.\n" +
                "If not generating code, the language should ALWAYS be 'other'."
            ),
          isValidReact: z
            .boolean()
            .optional()
            .describe(
              "Whether or not the generated code is valid React code. Only populate this field if generating code."
            ),
          artifact: z
            .string()
            .describe("The content of the artifact to generate."),
          title: z
            .string()
            .describe(
              "A short title to give to the artifact. Should be less than 5 words."
            ),
        }),
      },
    ],
    { tool_choice: "generate_artifact" }
  );

  const formattedNewArtifactPrompt = NEW_ARTIFACT_PROMPT.replace(
    "{reflections}",
    memoriesAsString
  );

  const response = await modelWithArtifactTool.invoke(
    [
      { role: "system", content: formattedNewArtifactPrompt },
      ...state.messages,
    ],
    { runName: "generate_artifact" }
  );

  const newArtifactType = response.tool_calls?.[0]?.args.type;
  let newArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  if (newArtifactType === "code") {
    newArtifactContent = {
      index: 1,
      type: "code",
      title: response.tool_calls?.[0]?.args.title,
      code: response.tool_calls?.[0]?.args.artifact,
      language: response.tool_calls?.[0]?.args.language,
    };
  } else {
    newArtifactContent = {
      index: 1,
      type: "text",
      title: response.tool_calls?.[0]?.args.title,
      fullMarkdown: response.tool_calls?.[0]?.args.artifact,
    };
  }

  const newArtifact: ArtifactV3 = {
    currentIndex: 1,
    contents: [newArtifactContent],
  };

  return {
    artifact: newArtifact,
  };
};
