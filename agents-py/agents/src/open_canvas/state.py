from typing import List, Optional, Dict, Any, Union, TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from shared.src.types import (
    ArtifactV3,
    CodeHighlight,
    TextHighlight,
    LanguageOptions,
    ArtifactLengthOptions,
    ReadingLevelOptions,
    ProgrammingLanguageOptions,
    SearchResult
)
from shared.src.constants import OC_SUMMARIZED_MESSAGE_KEY

# Define Messages type without BaseMessageLike
Messages = Union[List[BaseMessage], BaseMessage]

def is_summary_message(msg: Any) -> bool:
    """Check if message is a summary message.
    
    Args:
        msg: Message to check
        
    Returns:
        bool: True if message is a summary message
    """
    if not isinstance(msg, (dict, BaseMessage)) or isinstance(msg, list) or msg is None:
        return False

    if not hasattr(msg, "additional_kwargs") and not hasattr(msg, "kwargs"):
        return False

    if hasattr(msg, "additional_kwargs"):
        additional_kwargs = getattr(msg, "additional_kwargs", {})
        if additional_kwargs.get(OC_SUMMARIZED_MESSAGE_KEY) is True:
            return True

    if hasattr(msg, "kwargs"):
        kwargs = getattr(msg, "kwargs", {})
        if kwargs.get("additional_kwargs", {}).get(OC_SUMMARIZED_MESSAGE_KEY) is True:
            return True

    return False

class OpenCanvasGraphState(TypedDict, total=False):
    """State representation for Open Canvas graph"""
    
    # The full list of messages in the conversation
    messages: Annotated[List[BaseMessage], add_messages]
    
    # The list of messages passed to the model. Can include summarized messages,
    # and others which are NOT shown to the user
    _messages: List[BaseMessage]
    
    # The part of the artifact the user highlighted
    highlighted_code: Optional[CodeHighlight]
    
    # The highlighted text including markdown blocks and plain text content
    highlighted_text: Optional[TextHighlight]
    
    # The artifacts generated in the conversation
    artifact: Optional[ArtifactV3]
    
    # The next node to route to (only used for first routing node/conditional edge)
    next: Optional[str]
    
    # The language to translate the artifact to
    language: Optional[LanguageOptions]
    
    # The length of the artifact to regenerate to
    artifact_length: Optional[ArtifactLengthOptions]
    
    # Whether or not to regenerate with emojis
    regenerate_with_emojis: Optional[bool]
    
    # The reading level to adjust the artifact to
    reading_level: Optional[ReadingLevelOptions]
    
    # Whether or not to add comments to the code artifact
    add_comments: Optional[bool]
    
    # Whether or not to add logs to the code artifact
    add_logs: Optional[bool]
    
    # The programming language to port the code artifact to
    port_language: Optional[ProgrammingLanguageOptions]
    
    # Whether or not to fix bugs in the code artifact
    fix_bugs: Optional[bool]
    
    # The ID of the custom quick action to use
    custom_quick_action_id: Optional[str]
    
    # Whether or not to search the web for additional context
    web_search_enabled: Optional[bool]
    
    # The search results to include in context
    web_search_results: Optional[List[SearchResult]]

# Define return type as partial state
OpenCanvasGraphReturnType = Dict[str, Any]