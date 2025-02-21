from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage

class SummarizerGraphState(BaseModel):
    """State representation for Summarizer graph"""
    
    messages: List[BaseMessage] = Field(
        default_factory=list,
        description="List of messages to summarize"
    )
    thread_id: str = Field(
        ...,
        description="Original thread ID for state updates"
    )

SummarizeState = SummarizerGraphState
SummarizeGraphReturnType = Dict[str, Any] 