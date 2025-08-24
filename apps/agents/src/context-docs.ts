import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { convertPDFToText } from "./lib/pdf";
import { decodeBase64ToUtf8 } from "./lib/base64";
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

export async function createContextDocumentMessagesOpenAI(
  _config: LangGraphRunnableConfig,
  documents: LocalContextDoc[]
) {
  const messagesPromises = documents.map(async (doc) => {
    let text = "";
    if (doc?.type === "application/pdf") {
      text = await convertPDFToText(doc?.data);
    } else if (doc?.type?.startsWith("text/")) {
      text = decodeBase64ToUtf8(doc?.data);
    } else if (doc?.type === "text") {
      text = doc?.data;
    }
    return { type: "text", text };
  });
  return await Promise.all(messagesPromises);
}

export function mapSearchResultToContextDocument(
  searchResult: LocalSearchResult
): LocalContextDoc {
  return {
    name: searchResult?.metadata?.title || "Untitled",
    type: "text/plain",
    data: searchResult?.pageContent || "",
  };
}
