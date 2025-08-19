import { ChatOpenAI } from "@langchain/openai";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ArtifactMarkdownV3, ArtifactCodeV3 } from "@opencanvas/shared/types";
import { isArtifactMarkdownContent } from "@opencanvas/shared/utils/artifacts";

export function getModel(config: LangGraphRunnableConfig & { temperature?: number; maxTokens?: number }) {
  const modelName = process.env.OLLAMA_MODEL || "llama3.1";
  return new ChatOpenAI({
    model: modelName,
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 2048,
  });
}

// Helper for tool calling reliability (if Ollama flakes)
export function withToolPrompt(schema: any, prompt: string): string {
  return `${prompt}\nOutput in strict JSON matching this schema: ${JSON.stringify(schema)}. Do not add extra text.`;
}

export function formatArtifactContent(
  content: ArtifactMarkdownV3 | ArtifactCodeV3,
  shortenContent?: boolean
): string {
  if (isArtifactMarkdownContent(content)) {
    return content.fullMarkdown;
  } else {
    return content.code;
  }
}