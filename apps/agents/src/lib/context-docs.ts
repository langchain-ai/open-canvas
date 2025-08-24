// context-docs.ts
type LocalContextDoc = { name?: string; type: string; data: string };
type LocalSearchResult = {
  metadata?: {
    title?: string;
    url?: string;
    author?: string;
    publishedDate?: string;
  };
  pageContent?: string;
};

import { BaseMessage } from "@langchain/core/messages";

import { convertPDFToText } from "./pdf";
import { decodeBase64ToUtf8 } from "./base64";

export async function createContextDocumentMessagesOpenAI(
  messages: BaseMessage[]
): Promise<any[]> {
  const messagesPromises = messages.map(async (message) => {
    let text = message.content.toString(); // Assuming content is the relevant part
    return { type: "text", text };
  });
  return await Promise.all(messagesPromises);
}

export function mapSearchResultToContextDocument(
  searchResult: LocalSearchResult
): LocalContextDoc {
  return {
    type: "text",
    data: searchResult?.pageContent || "",
  };
}
