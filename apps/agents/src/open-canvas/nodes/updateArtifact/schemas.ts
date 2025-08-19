import { z } from "zod";

export const UPDATE_ARTIFACT_TOOL_SCHEMA = z
  .object({
    updatedContent: z.string().describe("The updated artifact content."),
  })
  .describe("Update the artifact content based on the user's request.");