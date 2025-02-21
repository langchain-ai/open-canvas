from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from shared.src.types import SearchResult

class WebSearchState(BaseModel):
    """State representation for Web Search graph"""
    
    messages: List[BaseMessage] = Field(
        default_factory=list,
        description="Chat history to search the web for. Uses latest user message as query."
    )
    query: str = Field(
        default="",
        description="The search query"
    )
    web_search_results: List[SearchResult] = Field(
        default_factory=list,
        description="The search results"
    )
    should_search: bool = Field(
        default=False,
        description="Whether to search the web based on the user's latest message"
    ) 