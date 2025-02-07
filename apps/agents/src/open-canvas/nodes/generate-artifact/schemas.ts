import { PROGRAMMING_LANGUAGES } from "@opencanvas/shared/constants";
import { z } from "zod";

export const ARTIFACT_TOOL_SCHEMA = z.object({
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
  artifact: z.string().describe("The content of the artifact to generate."),
  title: z
    .string()
    .describe(
      "A short title to give to the artifact. Should be less than 5 words."
    ),
});
