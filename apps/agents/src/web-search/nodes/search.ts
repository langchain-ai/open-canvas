import { SearchResult } from "@opencanvas/shared/dist/types";
import { WebSearchState } from "../state.js";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export async function search(
  state: WebSearchState
): Promise<Partial<WebSearchState>> {
  const searchTool = new TavilySearchResults({
    maxResults: 5, // default
    includeAnswer: true,
    days: 14, // include answers from the last 14 days
  });

  const query = state.messages[state.messages.length - 1].content as string;
  const resultsStr: string = await searchTool.invoke(query);
  const results: SearchResult[] = JSON.parse(resultsStr);

  return {
    webSearchResults: results,
  };
}
