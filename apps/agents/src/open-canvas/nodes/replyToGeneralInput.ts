import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { OpenCanvasGraphAnnotation, OpenCanvasGraphReturnType } from "../state.js";
import { AIMessage } from "@langchain/core/messages";
import { createContextDocumentMessagesOpenAI, mapSearchResultToContextDocument } from "../../utils.js";

export const replyToGeneralInput = async (
  state: typeof OpenCanvasGraphAnnotation.State
): Promise<OpenCanvasGraphReturnType> => {
  const contextDocuments = (state.webSearchResults || []).map(mapSearchResultToContextDocument);
  const contextDocumentMessages = (await createContextDocumentMessagesOpenAI(contextDocuments)).map(
    (msg) => new AIMessage({ content: msg.text })
  );

  return {
    messages: contextDocumentMessages,
    _messages: contextDocumentMessages,
  };

  // Rest of the implementation
};
  // ...

