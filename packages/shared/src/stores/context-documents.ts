import { CONTEXT_DOCUMENTS_NAMESPACE } from "../constants.js";
import { StoreFields } from "./types.js";

/**
 * Constructs the store fields for context documents.
 *
 * @param inputs The inputs for the store fields.
 * @returns The store fields for context documents.
 */
export function constructContextDocumentsFields(inputs: {
  assistantId: string;
}): StoreFields {
  return {
    namespace: CONTEXT_DOCUMENTS_NAMESPACE,
    key: inputs.assistantId,
  };
}
