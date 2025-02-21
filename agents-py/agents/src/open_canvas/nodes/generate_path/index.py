from typing import Dict, Any, List, Optional
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState, OpenCanvasGraphReturnType
from shared.src.utils.urls import extract_urls
from agents.src.open_canvas.nodes.generate_path.documents import (
    convert_context_document_to_human_message,
    fix_misformatted_context_doc_message
)
from agents.src.utils import get_string_from_content
from agents.src.open_canvas.nodes.generate_path.include_url_contents import include_url_contents
from agents.src.open_canvas.nodes.generate_path.dynamic_determine_path import dynamic_determine_path

def extract_urls_from_last_message(messages: List[BaseMessage]) -> List[str]:
    """Extract URLs from the last message in the list.
    
    Args:
        messages: List of messages
        
    Returns:
        List[str]: List of extracted URLs
    """
    if not messages:  # Add check for empty messages list
        return []
        
    recent_message = messages[-1]
    recent_message_content = get_string_from_content(recent_message.content)
    return extract_urls(recent_message_content)

async def generate_path(
    state: Dict[str, Any],
    config: RunnableConfig
) -> OpenCanvasGraphReturnType:
    """Routes to the proper node in the graph based on the user's query."""
    # Initialize with empty messages if not present
    _messages = state.get("_messages", [])
    new_messages: List[BaseMessage] = []

    # Handle document messages
    doc_message = await convert_context_document_to_human_message(_messages, config)
    
    existing_doc_message = next(
        (m for m in new_messages if isinstance(m.content, list) and 
         any(c.get("type") in ["document", "application/pdf"] for c in m.content)),
        None
    )
    
    if doc_message:
        new_messages.append(doc_message)
    elif existing_doc_message:
        fixed_messages = await fix_misformatted_context_doc_message(
            existing_doc_message, config
        )
        if fixed_messages:
            new_messages.extend(fixed_messages)

    # Check highlighted content
    if state.get("highlighted_code"):
        return {
            "next": "update_artifact",
            **({"messages": new_messages, "_messages": new_messages} if new_messages else {})
        }
    if state.get("highlighted_text"):
        return {
            "next": "update_highlighted_text",
            **({"messages": new_messages, "_messages": new_messages} if new_messages else {})
        }

    # Check rewrite themes
    if any([
        state.get("language"),
        state.get("artifact_length"),
        state.get("regenerate_with_emojis"),
        state.get("reading_level")
    ]):
        return {
            "next": "rewrite_artifact_theme",
            **({"messages": new_messages, "_messages": new_messages} if new_messages else {})
        }

    # Check code themes
    if any([
        state.get("add_comments"),
        state.get("add_logs"),
        state.get("port_language"),
        state.get("fix_bugs")
    ]):
        return {
            "next": "rewrite_code_artifact_theme",
            **({"messages": new_messages, "_messages": new_messages} if new_messages else {})
        }

    # Check custom actions
    if state.get("custom_quick_action_id"):
        return {
            "next": "custom_action",
            **({"messages": new_messages, "_messages": new_messages} if new_messages else {})
        }

    # Check web search
    if state.get("web_search_enabled"):
        return {
            "next": "web_search",
            **({"messages": new_messages, "_messages": new_messages} if new_messages else {})
        }

    # Handle URL content inclusion
    message_urls = extract_urls_from_last_message(_messages)
    updated_message: Optional[HumanMessage] = None
    if message_urls:
        updated_message = await include_url_contents(_messages[-1], message_urls)

    # Update internal message list
    new_internal_message_list = _messages.copy()
    if updated_message:
        new_internal_message_list = [
            updated_message if msg.id == updated_message.id else msg 
            for msg in new_internal_message_list
        ]

    # Create arguments dict matching TypeScript structure
    dynamic_path_args = {
        "state": {**state, "_messages": new_internal_message_list},
        "new_messages": new_messages,
        "config": config
    }

    # Determine path
    routing_result = await dynamic_determine_path(**dynamic_path_args)
    
    if not routing_result or not routing_result.get("route"):
        raise ValueError("Route not found")

    # Create messages object
    messages = (
        {
            "messages": new_messages,
            "_messages": [*new_internal_message_list, *new_messages]
        }
        if new_messages
        else {"_messages": new_internal_message_list}
    )

    return {
        "next": routing_result["route"],
        **messages
    }
