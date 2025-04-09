import { BaseStore } from "@langchain/langgraph";
import { formatReflections } from "../utils";
import { Reflections } from "@opencanvas/shared/types";
import { traceable } from "langsmith/traceable";

async function getReflectionsFunc(
  store: BaseStore | undefined,
  inputs: {
    assistantId: string | undefined;
    userId: string | undefined;
  }
): Promise<string> {
  if (!store) {
    throw new Error("No store found.");
  }
  const assistantId = inputs.assistantId;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const userId = inputs.userId;
  if (!userId) {
    throw new Error("`user_id` not found in configurable");
  }

  const memoryNamespace = ["memories", userId, assistantId];
  const memoryKey = "reflection";
  const memories = await store.get(memoryNamespace, memoryKey);
  const memoriesAsString = memories?.value
    ? formatReflections(memories.value as Reflections)
    : "No reflections found.";

  return memoriesAsString;
}

export const getReflections = traceable(getReflectionsFunc, {
  name: "get_reflections",
});

async function setReflectionsFunc(
  store: BaseStore | undefined,
  inputs: {
    assistantId: string | undefined;
    userId: string | undefined;
    reflections: Reflections;
  }
): Promise<void> {
  if (!store) {
    throw new Error("No store found.");
  }
  const assistantId = inputs.assistantId;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }
  const userId = inputs.userId;
  if (!userId) {
    throw new Error("`user_id` not found in configurable");
  }

  const memoryNamespace = ["memories", userId, assistantId];
  const memoryKey = "reflection";
  await store.put(memoryNamespace, memoryKey, inputs.reflections);
}

export const setReflections = traceable(setReflectionsFunc, {
  name: "set_reflections",
});
