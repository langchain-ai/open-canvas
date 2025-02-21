from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from shared.src.types import ArtifactV3

class TitleGenerationState(BaseModel):
    """State representation for Title Generation graph"""
    
    messages: List[BaseMessage] = Field(
        ...,
        description="The chat history to generate a title for"
    )
    artifact: Optional[ArtifactV3] = Field(
        default=None,
        description="The artifact that was generated/updated (if any)"
    )

TitleGenerationReturnType = Dict[str, Any] 