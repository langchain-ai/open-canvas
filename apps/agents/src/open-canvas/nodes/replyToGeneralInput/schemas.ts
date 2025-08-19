import { z } from "zod";

export const REPLY_TO_GENERAL_INPUT_TOOL_SCHEMA = z
  .object({
    response: z.string().describe("The response to the user's general input."),
  })
  .describe("Generate a response to the user's general input.");