import { ChatAnthropic } from "@langchain/anthropic";
import {
  type LangGraphRunnableConfig,
  StateGraph,
  START,
} from "@langchain/langgraph";
import { ReflectionGraphAnnotation, ReflectionGraphReturnType } from "./state";
import { Reflections } from "../../types";
import { REFLECT_SYSTEM_PROMPT } from "./prompts";
import { z } from "zod";
import { ensureStoreInConfig, formatReflections } from "../utils";

export const reflect = async (
  state: typeof ReflectionGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<ReflectionGraphReturnType> => {
  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.assistant_id;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);

  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections)
    : "No reflections found.";

  const generateReflectionsSchema = z.object({
    styleRules: z
      .array(z.string())
      .describe("The complete new list of style rules and guidelines."),
    content: z
      .array(z.string())
      .describe("The complete new list of memories/facts about the user."),
  });

  const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-20240620",
    temperature: 0,
  }).withStructuredOutput(generateReflectionsSchema, {
    name: "generate_reflections",
  });

  const formattedSystemPrompt = REFLECT_SYSTEM_PROMPT.replace(
    "{artifact}",
    state.artifact?.content ?? "No artifact found."
  ).replace("{reflections}", memoriesAsString);

  const result = await model.invoke([
    {
      role: "system",
      content: formattedSystemPrompt,
    },
    ...state.messages,
  ]);

  const newMemories = {
    styleRules: result.styleRules,
    content: result.content,
  };

  await store.put(memoryNamespace, memoryKey, newMemories);

  return {};
};

const builder = new StateGraph(ReflectionGraphAnnotation)
  .addNode("reflect", reflect)
  .addEdge(START, "reflect");

export const graph = builder.compile();
