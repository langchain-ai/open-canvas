import { ChatAnthropic } from "@langchain/anthropic";
import {
  type LangGraphRunnableConfig,
  StateGraph,
  START,
} from "@langchain/langgraph";
import {
  ReflectionGraphAnnotation,
  ReflectionGraphReturnType,
} from "./state.js";
import { Reflections } from "@opencanvas/shared/types";
import { REFLECT_SYSTEM_PROMPT, REFLECT_USER_PROMPT } from "./prompts.js";
import { z } from "zod";
import { ensureStoreInConfig, formatReflections } from "../utils.js";
import {
  getArtifactContent,
  isArtifactMarkdownContent,
} from "@opencanvas/shared/utils/artifacts";

export const reflect = async (
  state: typeof ReflectionGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<ReflectionGraphReturnType> => {
  const store = ensureStoreInConfig(config);
  const assistantId = config.configurable?.open_canvas_assistant_id;
  if (!assistantId) {
    throw new Error("`open_canvas_assistant_id` not found in configurable");
  }
  const memoryNamespace = ["memories", assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);

  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections)
    : "No reflections found.";

  const generateReflectionTool = {
    name: "generate_reflections",
    description: "Generate reflections based on the context provided.",
    schema: z.object({
      styleRules: z
        .array(z.string())
        .describe("The complete new list of style rules and guidelines."),
      content: z
        .array(z.string())
        .describe("The complete new list of memories/facts about the user."),
    }),
  };

  const model = new ChatAnthropic({
    model: "claude-3-5-sonnet-20240620",
    temperature: 0,
  }).bindTools([generateReflectionTool], {
    tool_choice: "generate_reflections",
  });

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  const artifactContent = currentArtifactContent
    ? isArtifactMarkdownContent(currentArtifactContent)
      ? currentArtifactContent.fullMarkdown
      : currentArtifactContent.code
    : undefined;

  const formattedSystemPrompt = REFLECT_SYSTEM_PROMPT.replace(
    "{artifact}",
    artifactContent ?? "No artifact found."
  ).replace("{reflections}", memoriesAsString);

  const formattedUserPrompt = REFLECT_USER_PROMPT.replace(
    "{conversation}",
    state.messages
      .map((msg) => `<${msg.getType()}>\n${msg.content}\n</${msg.getType()}>`)
      .join("\n\n")
  );

  const result = await model.invoke([
    {
      role: "system",
      content: formattedSystemPrompt,
    },
    {
      role: "user",
      content: formattedUserPrompt,
    },
  ]);
  const reflectionToolCall = result.tool_calls?.[0];
  if (!reflectionToolCall) {
    console.error("FAILED TO GENERATE TOOL CALL", result);
    throw new Error("Reflection tool call failed.");
  }

  const newMemories = {
    styleRules: reflectionToolCall.args.styleRules,
    content: reflectionToolCall.args.content,
  };

  await store.put(memoryNamespace, memoryKey, newMemories);

  return {};
};

const builder = new StateGraph(ReflectionGraphAnnotation)
  .addNode("reflect", reflect)
  .addEdge(START, "reflect");

export const graph = builder.compile().withConfig({ runName: "reflection" });
