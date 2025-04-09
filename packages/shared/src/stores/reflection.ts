import { StoreFields } from "./types.js";

/**
 * Constructs the store fields for reflections.
 *
 * @param inputs The inputs for the store fields.
 * @returns The store fields for reflections.
 */
export function constructReflectionFields(inputs: {
  userId: string;
  assistantId: string;
}): StoreFields {
  return {
    namespace: ["memories", inputs.userId, inputs.assistantId],
    key: "reflection",
  };
}
