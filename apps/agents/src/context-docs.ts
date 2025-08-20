import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { convertPDFToText } from "./lib/pdf";
import { decodeBase64ToUtf8 } from "./lib/base64";
import { ContextDocument, SearchResult } from "@opencanvas/shared/types";

export async function createContextDocumentMessagesOpenAI(
  _config: LangGraphRunnableConfig,
  documents: ContextDocument[]
) {
  const messagesPromises = documents.map(async (doc) => {
    let text = "";
    if (doc.type === "application/pdf") {
      text = await convertPDFToText(doc.data);
    } else if (doc.type.startsWith("text/")) {
      text = decodeBase64ToUtf8(doc.data);
    } else if (doc.type === "text") {
      text = doc.data;
    }
    return { type: "text", text };
  });
  return await Promise.all(messagesPromises);
}

export function mapSearchResultToContextDocument(searchResult: SearchResult): ContextDocument {
  return {
    name: searchResult.metadata.title || "Untitled",
    type: "text/plain",
    data: searchResult.pageContent || "",
  };
}