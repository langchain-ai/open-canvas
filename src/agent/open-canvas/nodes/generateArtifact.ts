import { ChatOpenAI } from "@langchain/openai";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state";
import { NEW_ARTIFACT_PROMPT } from "../prompts";
import { Artifact, Reflections } from "../../../types";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ensureStoreInConfig, formatReflections } from "@/agent/utils";
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
            .string()
            .describe(
              "The language of the artifact to generate. " +
                " If generating code, it should be the programming language. " +
                "For programming languages, ensure it's one of the following" +
                "'javascript' | 'typescript' | 'cpp' | 'java' | 'php' | 'python' | 'html' | 'other'"
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
  const newArtifact: Artifact = {
    id: response.id ?? uuidv4(),
    content: response.tool_calls?.[0]?.args.artifact,
    title: response.tool_calls?.[0]?.args.title,
    type: response.tool_calls?.[0]?.args.type,
    language: response.tool_calls?.[0]?.args.language,
  };

  return {
    lastNodeName: "generateArtifact",
    artifacts: [newArtifact],
  };
};
