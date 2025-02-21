from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from shared.src.types import ArtifactV3

class ReflectionGraphState(BaseModel):
    """State representation for Reflection graph"""
    
    messages: List[BaseMessage] = Field(
        default_factory=list,
        description="List of messages to reflect on"
    )
    artifact: Optional[ArtifactV3] = Field(
        default=None,
        description="Artifact to reflect on"
    )

ReflectionGraphReturnType = Dict[str, Any]  # Can contain partial state updates 