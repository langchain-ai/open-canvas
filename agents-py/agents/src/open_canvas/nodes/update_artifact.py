from typing import Dict, Any
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from agents.src.utils import (
    create_context_document_messages,
    ensure_store_in_config,
    format_reflections,
    get_model_config,
    get_model_from_config,
    is_using_o1_mini_model
)
from shared.src.utils.artifacts import (
    get_artifact_content,
    is_artifact_code_content
)
from shared.src.types import ArtifactV3, ArtifactCodeV3
from agents.src.open_canvas.prompts import UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT

async def update_artifact(
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
        small_model = await get_model_from_config(config, {"temperature": 0})
    else:
        # Custom model is not intelligent enough for updating artifacts
        fallback_config = {
            **config,
            "configurable": {"custom_model_name": "gpt-4o"}
        }
        small_model = await get_model_from_config(fallback_config, {"temperature": 0})

    # Get reflections from store
    store = ensure_store_in_config(config)
    assistant_id = config.get("configurable", {}).get("assistant_id")
    if not assistant_id:
        raise ValueError("`assistant_id` not found in configurable")
    
    memory_namespace = ["memories", assistant_id]
    memory_key = "reflection"
    memories = await store.get(memory_namespace, memory_key)
    memories_str = memories.get("value", None) if memories else None
    memories_as_string = format_reflections(memories_str) if memories_str else "No reflections found."

    # Get current artifact content
    current_artifact_content = None
    if state.get("artifact"):
        current_artifact_content = get_artifact_content(state["artifact"])
    if not current_artifact_content:
        raise ValueError("No artifact found")
    if not is_artifact_code_content(current_artifact_content):
        raise ValueError("Current artifact content is not code")

    # Check for highlighted code
    highlighted_code = state.get("highlighted_code")
    if not highlighted_code:
        raise ValueError("Cannot partially regenerate an artifact without a highlight")

    # Extract code sections with context
    start = max(0, highlighted_code["start_char_index"] - 500)
    end = min(
        len(current_artifact_content["code"]),
        highlighted_code["end_char_index"] + 500
    )

    before_highlight = current_artifact_content["code"][start:highlighted_code["start_char_index"]]
    highlighted_text = current_artifact_content["code"][
        highlighted_code["start_char_index"]:highlighted_code["end_char_index"]
    ]
    after_highlight = current_artifact_content["code"][highlighted_code["end_char_index"]:end]

    # Format prompt
    formatted_prompt = UPDATE_HIGHLIGHTED_ARTIFACT_PROMPT.format(
        highlighted_text=highlighted_text,
        before_highlight=before_highlight,
        after_highlight=after_highlight,
        reflections=memories_as_string
    )

    # Get recent human message
    recent_human_message = next(
        (msg for msg in reversed(state.get("_messages", [])) if msg.type == "human"),
        None
    )
    if not recent_human_message:
        raise ValueError("No recent human message found")

    # Get context and invoke model
    context_docs = await create_context_document_messages(config)
    is_o1_mini = is_using_o1_mini_model(config)
    
    updated_artifact = await small_model.invoke([
        {"role": "user" if is_o1_mini else "system", "content": formatted_prompt},
        *context_docs,
        recent_human_message
    ])

    # Update artifact content
    artifact = state["artifact"]
    entire_text_before = current_artifact_content["code"][:highlighted_code["start_char_index"]]
    entire_text_after = current_artifact_content["code"][highlighted_code["end_char_index"]:]
    entire_updated_content = f"{entire_text_before}{updated_artifact.content}{entire_text_after}"

    new_artifact_content = {
        **current_artifact_content,
        "index": len(artifact["contents"]) + 1,
        "code": entire_updated_content
    }

    return {
        "artifact": {
            **artifact,
            "current_index": len(artifact["contents"]) + 1,
            "contents": [*artifact["contents"], new_artifact_content]
        }
    } 