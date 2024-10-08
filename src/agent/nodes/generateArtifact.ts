import { ChatOpenAI } from "@langchain/openai";
import { GraphAnnotation, GraphReturnType } from "../state";
import { NEW_ARTIFACT_PROMPT } from "../prompts";
import { Artifact } from "../../types";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a new artifact based on the user's query.
 */
export const generateArtifact = async (
  state: typeof GraphAnnotation.State
): Promise<GraphReturnType> => {
  const smallModel = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.5,
  });

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
                "'javascript' | 'typescript' | 'cpp' | 'java' | 'php' | 'python' | 'other'"
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

  const response = await modelWithArtifactTool.invoke(
    [{ role: "system", content: NEW_ARTIFACT_PROMPT }, ...state.messages],
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
    artifacts: [newArtifact],
  };
};
