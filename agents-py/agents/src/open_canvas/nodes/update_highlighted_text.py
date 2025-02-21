from typing import Dict, Any
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from agents.src.utils import (
    create_context_document_messages,
    get_model_config,
    get_model_from_config,
    is_using_o1_mini_model
)
from shared.src.utils.artifacts import (
    get_artifact_content,
    is_artifact_markdown_content
)
from shared.src.types import ArtifactV3, ArtifactMarkdownV3

PROMPT = """You are an expert AI writing assistant, tasked with rewriting some text a user has selected. The selected text is nested inside a larger 'block'. You should always respond with ONLY the updated text block in accordance with the user's request.
You should always respond with the full markdown text block, as it will simply replace the existing block in the artifact.
The blocks will be joined later on, so you do not need to worry about the formatting of the blocks, only make sure you keep the formatting and structure of the block you are updating.

# Selected text
{highlighted_text}

# Text block
{text_blocks}

Your task is to rewrite the surrounding content to fulfill the users request. The selected text content you are provided above has had the markdown styling removed, so you can focus on the text itself.
However, ensure you ALWAYS respond with the full markdown text block, including any markdown syntax.
NEVER wrap your response in any additional markdown syntax, as this will be handled by the system. Do NOT include a triple backtick wrapping the text block unless it was present in the original text block.
You should NOT change anything EXCEPT the selected text. The ONLY instance where you may update the surrounding text is if it is necessary to make the selected text make sense.
You should ALWAYS respond with the full, updated text block, including any formatting, e.g newlines, indents, markdown syntax, etc. NEVER add extra syntax or formatting unless the user has specifically requested it.
If you observe partial markdown, this is OKAY because you are only updating a partial piece of the text.

Ensure you reply with the FULL text block including the updated selected text. NEVER include only the updated selected text, or additional prefixes or suffixes."""

async def update_highlighted_text(
    state: Dict[str, Any],
    config: RunnableConfig
) -> Dict[str, Any]:
    """Update an existing artifact based on the user's query.
    
    Args:
        state: Current state
        config: Runnable configuration
        
    Returns:
        Dict[str, Any]: Updated state
    """
    # Get model configuration
    model_config = get_model_config(config)
    model_provider = model_config.get("model_provider", "")
    model_name = model_config.get("model_name", "")

    # Select appropriate model based on provider
    if "openai" in model_provider or "3-5-sonnet" in model_name:
        # Custom model is intelligent enough for updating artifacts
        model = await get_model_from_config(config, {"temperature": 0})
        model.config = {"run_name": "update_highlighted_markdown"}
    else:
        # Custom model is not intelligent enough for updating artifacts
        fallback_config = {
            **config,
            "configurable": {"custom_model_name": "gpt-4o"}
        }
        model = await get_model_from_config(fallback_config, {"temperature": 0})
        model.config = {"run_name": "update_highlighted_markdown"}

    # Get current artifact content
    current_artifact_content = None
    if state.get("artifact"):
        current_artifact_content = get_artifact_content(state["artifact"])
    if not current_artifact_content:
        raise ValueError("No artifact found")
    if not is_artifact_markdown_content(current_artifact_content):
        raise ValueError("Artifact is not markdown content")

    # Check for highlighted text
    highlighted_text = state.get("highlighted_text")
    if not highlighted_text:
        raise ValueError("Cannot partially regenerate an artifact without a highlight")

    # Format prompt
    formatted_prompt = PROMPT.format(
        highlighted_text=highlighted_text["selected_text"],
        text_blocks=highlighted_text["markdown_block"]
    )

    # Get recent user message
    messages = state.get("_messages", [])
    if not messages:
        raise ValueError("No messages found")
    recent_user_message = messages[-1]
    if recent_user_message.type != "human":
        raise ValueError("Expected a human message")

    # Get context and invoke model
    context_docs = await create_context_document_messages(config)
    is_o1_mini = is_using_o1_mini_model(config)
    
    response = await model.invoke([
        {"role": "user" if is_o1_mini else "system", "content": formatted_prompt},
        *context_docs,
        recent_user_message
    ])

    # Update artifact content
    artifact = state["artifact"]
    new_curr_index = len(artifact["contents"]) + 1
    prev_content = next(
        (c for c in artifact["contents"] 
         if c["index"] == artifact["current_index"] and c["type"] == "text"),
        None
    )
    if not prev_content:
        raise ValueError("Previous content not found")

    if highlighted_text["full_markdown"].find(highlighted_text["markdown_block"]) == -1:
        raise ValueError("Selected text not found in current content")

    new_full_markdown = highlighted_text["full_markdown"].replace(
        highlighted_text["markdown_block"],
        response.content
    )

    updated_artifact_content = {
        **prev_content,
        "index": new_curr_index,
        "full_markdown": new_full_markdown
    }

    return {
        "artifact": {
            **artifact,
            "current_index": new_curr_index,
            "contents": [*artifact["contents"], updated_artifact_content]
        }
    } 