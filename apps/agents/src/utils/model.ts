import { ChatOpenAI } from "@langchain/openai";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ArtifactMarkdownV3, ArtifactCodeV3 } from "@opencanvas/shared/types";
import { isArtifactMarkdownContent } from "@opencanvas/shared/utils/artifacts";

export function getModelFromConfig(
  config: LangGraphRunnableConfig & { temperature?: number; maxTokens?: number }
) {
  let modelName =
    config.configurable?.customModelName ||
    process.env.OLLAMA_MODEL ||
    "ollama-llama3.1";

  // Normalize model name for local-only usage
  if (modelName.startsWith("ollama-")) {
    modelName = modelName.replace("ollama-", "");
  }

  const model = new ChatOpenAI({
    model: modelName,
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 2048,
  });

  // Disable tool choice for local models
  if (modelName.includes("ollama") || modelName.includes("litellm")) {
    (model as any).tool_choice = "none";
  }

  return model;
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
export function isUsingO1MiniModel(config: LangGraphRunnableConfig) {
  const modelName =
    config.configurable?.customModelName ||
    process.env.OLLAMA_MODEL ||
    "ollama-llama3.1";
  return modelName.includes("o1-mini");
}
