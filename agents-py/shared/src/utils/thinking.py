from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from langchain_core.messages import AIMessage, BaseMessage
from shared.src.models import THINKING_MODELS

class ThinkingAndResponseTokens(BaseModel):
    thinking: str
    response: str

def extract_thinking_and_response_tokens(text: str) -> ThinkingAndResponseTokens:
    """
    Extracts thinking and response content from text containing XML-style think tags.
    Handles incomplete tags during streaming.

    Args:
        text: Input text potentially containing <think> tags

    Returns:
        ThinkingAndResponseTokens with separated content

    Example:
        >>> extract_thinking_and_response_tokens('Hello <think>processing...</think>world')
        ThinkingAndResponseTokens(thinking='processing...', response='Hello world')
    """
    think_start_tag = "<think>"
    think_end_tag = "</think>"

    start_idx = text.find(think_start_tag)
    if start_idx == -1:
        return ThinkingAndResponseTokens(thinking="", response=text.strip())

    after_start = text[start_idx + len(think_start_tag):]
    end_idx = after_start.find(think_end_tag)

    if end_idx == -1:
        return ThinkingAndResponseTokens(
            thinking=after_start.strip(),
            response=text[:start_idx].strip()
        )

    thinking = after_start[:end_idx].strip()
    response = (text[:start_idx] + after_start[end_idx + len(think_end_tag):]).strip()
    return ThinkingAndResponseTokens(thinking=thinking, response=response)

class HandleRewriteParams(BaseModel):
    new_content: str
    messages: List[BaseMessage]
    thinking_id: str

def handle_rewrite_artifact_thinking(params: HandleRewriteParams) -> Tuple[str, List[BaseMessage]]:
    """
    Processes thinking tokens in artifact content and updates messages.

    Returns:
        Tuple of (cleaned response content, updated messages list)
    """
    extracted = extract_thinking_and_response_tokens(params.new_content)
    new_messages = params.messages.copy()

    if extracted.thinking:
        # Update or create thinking message
        updated = False
        for i, msg in enumerate(new_messages):
            if msg.id == params.thinking_id:
                new_messages[i] = AIMessage(
                    id=params.thinking_id,
                    content=extracted.thinking
                )
                updated = True
                break
        
        if not updated:
            new_messages.append(AIMessage(
                id=params.thinking_id,
                content=extracted.thinking
            ))

    return extracted.response, new_messages

def is_thinking_model(model_name: str) -> bool:
    """Check if model is configured for thinking output"""
    return model_name in THINKING_MODELS 