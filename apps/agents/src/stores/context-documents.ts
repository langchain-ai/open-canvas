import { BaseStore } from "@langchain/langgraph";
import { ContextDocument } from "@opencanvas/shared/types";
import { traceable } from "langsmith/traceable";
import { constructContextDocumentsFields } from "@opencanvas/shared/stores/context-documents";

async function getContextDocumentsFunc(
  store: BaseStore | undefined,
  inputs: {
    assistantId: string | undefined;
  }
): Promise<ContextDocument[]> {
  if (!store) {
    throw new Error("No store found.");
  }
  const assistantId = inputs.assistantId;
  if (!assistantId) {
    throw new Error("`user_id` not found in configurable");
  }

  const { namespace, key } = constructContextDocumentsFields({
    assistantId,
  });

  const item = await store.get(namespace, key);
  if (!item?.value?.documents) {
    return [];
  }
  return item.value.documents;
}

export const getContextDocuments = traceable(getContextDocumentsFunc, {
  name: "get_context_documents",
});

async function setContextDocumentsFunc(
  store: BaseStore | undefined,
  inputs: {
    assistantId: string | undefined;
    documents: ContextDocument[];
  }
): Promise<void> {
  if (!store) {
    throw new Error("No store found.");
  }
  const assistantId = inputs.assistantId;
  if (!assistantId) {
    throw new Error("`assistant_id` not found in configurable");
  }

  const { namespace, key } = constructContextDocumentsFields({
    assistantId,
  });

  await store.put(namespace, key, { documents: inputs.documents });
}

export const setContextDocuments = traceable(setContextDocumentsFunc, {
  name: "set_context_documents",
});
