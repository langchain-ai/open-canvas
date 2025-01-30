import { ContextDocument } from "@/hooks/useAssistants";
import { useMessage, getExternalStoreMessage } from "@assistant-ui/react";
import { HumanMessage } from "@langchain/core/messages";
import { UploadedFiles } from "../assistant-select/uploaded-file";

export const ContextDocumentsUI = () => {
  const documents = useMessage((m) => {
    console.log(m);
    const msg = getExternalStoreMessage<HumanMessage>(m);
    return msg?.additional_kwargs?.documents as ContextDocument[] | undefined;
  });

  if (!documents || !documents.length) return null;
  console.log(documents);
  return null;
  return <UploadedFiles files={documents} />;
};
