import { AnthropicInput, ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI, OpenAIChatInput } from "@langchain/openai";

export const openAIModels = ["gpt-4o-mini", "gpt-4o"] as const;
export const anthropicModels = ["claude-3-5-sonnet-20240620"] as const;

export type OpenAIModel = (typeof openAIModels)[number];
export type AnthropicModel = (typeof anthropicModels)[number];
export type AllModelNames = OpenAIModel | AnthropicModel;

type ModelOptions<K extends AllModelNames> = K extends OpenAIModel
  ? OpenAIChatInput
  : K extends AnthropicModel
    ? AnthropicInput
    : never;

export function createModelInstance<K extends AllModelNames>(
  modelName: K,
  options: ModelOptions<K>
) {
  const openAIKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openAIModels.includes(modelName as OpenAIModel)) {
    if (!openAIKey) {
      throw new Error("OPENAI_API_KEY API key is missing.");
    }

    return new ChatOpenAI({
      openAIApiKey: openAIKey,
      modelName: modelName,
      ...options,
    });
  } else if (anthropicModels.includes(modelName as AnthropicModel)) {
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY API key is missing.");
    }

    return new ChatAnthropic({
      anthropicApiKey: anthropicKey,
      modelName: modelName,
      ...options,
    });
  } else {
    throw new Error(`Unknown model name: ${modelName}`);
  }
}
