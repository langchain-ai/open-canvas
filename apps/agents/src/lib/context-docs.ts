// context-docs.ts
import { ContextDocument } from "@opencanvas/shared";
import { convertPDFToText } from "./pdf";
import { decodeBase64ToUtf8 } from "./base64";

export async function createContextDocumentMessagesOpenAI(
  documents: ContextDocument[]
): Promise<any[]> {
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

export function mapSearchResultToContextDocument(searchResult: any): ContextDocument {
  return {
    type: 'text',
    data: 'sample data'
  };
}