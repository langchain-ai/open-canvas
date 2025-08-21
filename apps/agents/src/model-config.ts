import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
type LocalModelConfig = { temperatureRange?: { current?: number }, maxTokens?: { current?: number } } | undefined;


export const getModelConfig = (
  config: LangGraphRunnableConfig
): {
  modelName: string;
  modelProvider: string;
  modelConfig?: LocalModelConfig;
  baseUrl?: string;
} => {
  const customModelName = config.configurable?.customModelName as string;
  if (!customModelName) throw new Error("Model name is missing in config.");

  if (customModelName.startsWith("litellm-")) {
    return {
      modelName: customModelName.replace("litellm-", ""),
      modelProvider: "litellm",
      baseUrl: process.env.LITELLM_BASE_URL || "http://litellm:8000/v1",
    };
  }

  if (customModelName.startsWith("ollama-")) {
    return {
      modelName: customModelName.replace("ollama-", ""),
      modelProvider: "ollama",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://ollama:11434/v1",
    };
  }

  throw new Error("Invalid model name prefix. Use 'litellm-' or 'ollama-'");
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
