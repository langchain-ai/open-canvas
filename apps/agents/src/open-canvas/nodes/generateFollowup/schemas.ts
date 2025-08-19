import { z } from "zod";

export const GENERATE_FOLLOWUP_TOOL_SCHEMA = z
  .object({
    followup: z.string().describe("The follow-up message to be generated."),
  })
  .describe("Generate a follow-up message based on the artifact and conversation history.");