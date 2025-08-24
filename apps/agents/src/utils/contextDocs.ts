import { MessageContentComplex } from "@langchain/core/messages";
import { convertPDFToText } from "./pdf";
import { cleanBase64, decodeBase64ToUtf8 } from "../lib/base64";
import { ContextDocument, SearchResult } from "@opencanvas/shared/types";

import { AIMessage } from "@langchain/core/messages";

export async function createContextDocumentMessagesOpenAI(
  documents: any[]
): Promise<AIMessage[]> {
  const messagesPromises = documents.map(async (doc: any) => {
    let text = "";
    if (doc?.type && doc?.data) {
      if (doc.type === "application/pdf") {
        text = await convertPDFToText(doc.data as string);
      } else if (typeof doc.type === "string" && doc.type.startsWith("text/")) {
        text = decodeBase64ToUtf8(doc.data as string);
      } else if (doc.type === "text") {
        text = doc.data as string;
      }
    }
    return new AIMessage(text);
  });
  return await Promise.all(messagesPromises);
}

export function mapSearchResultToContextDocument(
  searchResult: SearchResult
): ContextDocument {
  return {
    name: searchResult.metadata?.title || "Untitled",
    type: "text/plain",
    data: searchResult.metadata?.url || "",
  };
}
