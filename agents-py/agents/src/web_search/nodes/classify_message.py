from typing import Dict, Any
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field
from agents.src.web_search.state import WebSearchState

__all__ = ["classify_message"]

CLASSIFIER_PROMPT = """You're a helpful AI assistant tasked with classifying the user's latest message.
The user has enabled web search for their conversation, however not all messages should be searched.

Analyze their latest message in isolation and determine if it warrants a web search to include additional context.

<message>
{message}
</message>"""

class ClassificationSchema(BaseModel):
    """The classification of the user's latest message."""
    should_search: bool = Field(
        ...,
        description="Whether or not to search the web based on the user's latest message."
    )

async def classify_message(state: WebSearchState) -> Dict[str, Any]:
    """Classify whether the latest message warrants a web search.
    
    Args:
        state: Current state of web search
        
    Returns:
        Dict containing should_search boolean
    """
    model = ChatAnthropic(
        model="claude-3-5-sonnet-latest",
        temperature=0
    ).bind_tools(
        [ClassificationSchema],
        tool_choice={"type": "function", "function": {"name": "ClassificationSchema"}}
    )

    # Get the latest message content
    latest_message = state.messages[-1].content
    if isinstance(latest_message, list):
        latest_message = " ".join([item.get("text", "") for item in latest_message if isinstance(item, dict)])
    
    # Format the prompt with the latest message
    formatted_prompt = CLASSIFIER_PROMPT.format(message=latest_message)
    
    # Get classification from model
    response = await model.ainvoke([("user", formatted_prompt)])
    
    if not response.tool_calls:
        return {"should_search": False}
    
    classification = response.tool_calls[0]["args"]
    return {"should_search": classification["should_search"]} 