import { BaseStore } from "@langchain/langgraph";
import { formatReflections } from "../utils.js";
import { Reflections } from "@opencanvas/shared/types";
import { traceable } from "langsmith/traceable";
import { constructReflectionFields } from "@opencanvas/shared/stores/reflection";

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

  const { namespace, key } = constructReflectionFields({
    userId,
    assistantId,
  });

  const memories = await store.get(namespace, key);
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

  const { namespace, key } = constructReflectionFields({
    userId,
    assistantId,
  });
  await store.put(namespace, key, inputs.reflections);
}

export const setReflections = traceable(setReflectionsFunc, {
  name: "set_reflections",
});
