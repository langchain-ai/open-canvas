import { ContextDocument } from "@/hooks/useAssistants";
import { HumanMessage } from "@langchain/core/messages";
import { UploadedFiles } from "../assistant-select/context-documents/uploaded-file";

export const ContextDocumentsUI = ({
  message,
  className,
}: {
  message: HumanMessage;
  className?: string;
}) => {
  const documents = message?.additional_kwargs?.documents as ContextDocument[];
  if (!documents?.length) {
    return null;
  }

  return <UploadedFiles files={documents} className={className} />;
};
