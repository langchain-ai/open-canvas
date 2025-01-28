import { HumanMessage } from "@langchain/core/messages";

export const CODEGEN_DATA: Record<string, any> = {
  inputs: {
    messages: [
      new HumanMessage("Write me code for an LLM agent that does scraping"),
    ],
    next: "generateArtifact",
  },
};
