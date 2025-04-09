import { StoreFields } from "./types.js";

/**
 * Constructs the store fields for custom actions.
 *
 * @param inputs The inputs for the store fields.
 * @returns The store fields for custom actions.
 */
export function constructCustomActionsFields(inputs: {
  userId: string;
}): StoreFields {
  return {
    namespace: ["custom_actions", inputs.userId],
    key: "actions",
  };
}
