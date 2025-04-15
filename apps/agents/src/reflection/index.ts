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
import { REFLECT_SYSTEM_PROMPT, REFLECT_USER_PROMPT } from "./prompts.js";
import { z } from "zod";
import {
  getArtifactContent,
  isArtifactMarkdownContent,
} from "@opencanvas/shared/utils/artifacts";
import { getReflections, setReflections } from "../stores/reflections.js";
import { Reflections } from "@opencanvas/shared/types";

export const reflect = async (
  state: typeof ReflectionGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<ReflectionGraphReturnType> => {
  const reflections = await getReflections(config.store, {
    assistantId: config.configurable?.assistant_id,
    userId: config.configurable?.user_id,
  });

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
  ).replace("{reflections}", reflections);

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

  const newMemories: Reflections = {
    styleRules: reflectionToolCall.args.styleRules,
    content: reflectionToolCall.args.content,
  };

  await setReflections(config.store, {
    assistantId: config.configurable?.assistant_id,
    userId: config.configurable?.user_id,
    reflections: newMemories,
  });

  return {};
};

const builder = new StateGraph(ReflectionGraphAnnotation)
  .addNode("reflect", reflect)
  .addEdge(START, "reflect");

export const graph = builder.compile().withConfig({ runName: "reflection" });
