from typing import Dict, Any
from ..state import WebSearchState
from shared.src.types import SearchResult
import os
from langchain_community.tools import TavilySearchResults
import dotenv

dotenv.load_dotenv()

async def search(state: WebSearchState) -> Dict[str, Any]:
   
    search = TavilySearchResults(
        max_results=5,
        include_raw_content=True,
        api_key=os.getenv("TAVILY_API_KEY", "")
    )
    
    query = state.messages[-1].content
    if isinstance(query, list):
        query = " ".join([item.text for item in query if hasattr(item, "text")])
    
    results = await search.ainvoke(query)
    
    return {
        "web_search_results": [SearchResult(**result) for result in results]
    } 