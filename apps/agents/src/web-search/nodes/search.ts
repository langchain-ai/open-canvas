import { SearchResult } from "@opencanvas/shared/types";
import { WebSearchState } from "../state.js";
import ExaClient from "exa-js";
import { ExaRetriever } from "@langchain/exa";

export async function search(
  state: WebSearchState
): Promise<Partial<WebSearchState>> {
  const exaClient = new ExaClient(process.env.EXA_API_KEY || "");
  const retriever = new ExaRetriever({
    client: exaClient,
    searchArgs: {
      filterEmptyResults: true,
      numResults: 5,
    },
  });

  const query = state.messages[state.messages.length - 1].content as string;
  const results = await retriever.invoke(query);

  return {
    webSearchResults: results as SearchResult[],
  };
}
