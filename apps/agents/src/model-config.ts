import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { CustomModelConfig } from "@opencanvas/shared/types";

export const getModelConfig = (
  config: LangGraphRunnableConfig
): {
  modelName: string;
  modelProvider: string;
  modelConfig?: CustomModelConfig;
  baseUrl?: string;
} => {
  const customModelName = config.configurable?.customModelName as string;
  if (!customModelName) throw new Error("Model name is missing in config.");

  if (customModelName.startsWith("ollama-")) {
    return {
      modelName: customModelName.replace("ollama-", ""),
      modelProvider: "ollama",
    };
  }

  // Default to LiteLLM proxy
  return {
    modelName: customModelName,
    modelProvider: "openai",
    baseUrl: process.env.LITELLM_BASE_URL,
  };
};

export async function getModelFromConfig(
  config: LangGraphRunnableConfig,
  extra?: {
    temperature?: number;
    maxTokens?: number;
    isToolCalling?: boolean;
  }
): Promise<ChatOpenAI> {
  const { modelName } = getModelConfig(config);
  const { temperature = 0.5, maxTokens } = {
    temperature: config.configurable?.modelConfig?.temperatureRange.current,
    maxTokens: config.configurable?.modelConfig?.maxTokens.current,
    ...extra,
  };

  return new ChatOpenAI({
    modelName,
    temperature,
    maxTokens,
  });
}

export function isUsingO1MiniModel(config: LangGraphRunnableConfig) {
  const { modelName } = getModelConfig(config);
  return modelName.includes("o1-mini");
}