import uuid
from typing import Dict, Any
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState
from shared.src.types import ArtifactV3, ArtifactMarkdownV3
from agents.src.utils import (
    get_model_config,
    get_model_from_config,
    format_reflections,
    ensure_store_in_config
)
from agents.src.open_canvas.prompts import (
    CHANGE_ARTIFACT_LANGUAGE_PROMPT,
    CHANGE_ARTIFACT_READING_LEVEL_PROMPT,
    CHANGE_ARTIFACT_TO_PIRATE_PROMPT,
    CHANGE_ARTIFACT_LENGTH_PROMPT,
    ADD_EMOJIS_TO_ARTIFACT_PROMPT
)

async def rewrite_artifact_theme(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    model_config = get_model_config(config)
    small_model = await get_model_from_config(config)
    
    store = ensure_store_in_config(config)
    assistant_id = config.get("configurable", {}).get("assistant_id")
    if not assistant_id:
        raise ValueError("`assistant_id` not found in configurable")
    
    memory_namespace = ["memories", assistant_id]
    memory_key = "reflection"
    memories = await store.get(memory_namespace, memory_key)
    
    memories_str = format_reflections(
        memories.get("value") if memories else None
    ) if memories else "No reflections found."

    current_artifact_content = None
    if state.artifact and state.artifact.contents:
        current_artifact_content = state.artifact.contents[-1]
        if not isinstance(current_artifact_content, ArtifactMarkdownV3):
            raise ValueError("Current artifact content is not markdown")

    if not current_artifact_content:
        raise ValueError("No artifact found")

    formatted_prompt = ""
    if state.language:
        formatted_prompt = CHANGE_ARTIFACT_LANGUAGE_PROMPT.format(
            new_language=state.language,
            artifact_content=current_artifact_content.full_markdown
        )
    elif state.reading_level and state.reading_level != "pirate":
        reading_level_map = {
            "child": "elementary school student",
            "teenager": "high school student",
            "college": "college student",
            "phd": "PhD student"
        }
        formatted_prompt = CHANGE_ARTIFACT_READING_LEVEL_PROMPT.format(
            new_reading_level=reading_level_map.get(state.reading_level, ""),
            artifact_content=current_artifact_content.full_markdown
        )
    elif state.reading_level == "pirate":
        formatted_prompt = CHANGE_ARTIFACT_TO_PIRATE_PROMPT.format(
            artifact_content=current_artifact_content.full_markdown
        )
    elif state.artifact_length:
        length_map = {
            "shortest": "much shorter than it currently is",
            "short": "slightly shorter than it currently is",
            "long": "slightly longer than it currently is",
            "longest": "much longer than it currently is"
        }
        formatted_prompt = CHANGE_ARTIFACT_LENGTH_PROMPT.format(
            new_length=length_map.get(state.artifact_length, ""),
            artifact_content=current_artifact_content.full_markdown
        )
    elif state.regenerate_with_emojis:
        formatted_prompt = ADD_EMOJIS_TO_ARTIFACT_PROMPT.format(
            artifact_content=current_artifact_content.full_markdown
        )
    else:
        raise ValueError("No theme selected")

    formatted_prompt = formatted_prompt.replace("{reflections}", memories_str)

    response = await small_model.invoke([{"role": "user", "content": formatted_prompt}])
    
    new_content = response.content
    thinking_message = None
    
    if "thinking" in model_config.get("model_name", "").lower():
        # Simplified thinking extraction logic
        thinking, _, content = new_content.partition("\n\n")
        thinking_message = AIMessage(
            id=f"thinking-{uuid.uuid4()}",
            content=thinking
        )
        new_content = content

    new_artifact_content = ArtifactMarkdownV3(
        index=len(state.artifact.contents) + 1,
        type="text",
        title=current_artifact_content.title,
        full_markdown=new_content
    )

    new_artifact = ArtifactV3(
        current_index=len(state.artifact.contents) + 1,
        contents=[*state.artifact.contents, new_artifact_content]
    )

    return {
        "artifact": new_artifact,
        "messages": [thinking_message] if thinking_message else [],
        "_messages": [thinking_message] if thinking_message else []
    } 