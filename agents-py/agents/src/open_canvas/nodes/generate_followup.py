from typing import Dict, Any
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState
from shared.src.types import ArtifactV3, Reflections
from agents.src.utils import (
    ensure_store_in_config,
    format_reflections,
    get_model_from_config
)
from agents.src.open_canvas.prompts import FOLLOWUP_ARTIFACT_PROMPT

async def generate_followup(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    small_model = await get_model_from_config(
        config, 
        {"max_tokens": 250, "is_tool_calling": True}
    )
    
    store = ensure_store_in_config(config)
    assistant_id = config.get("configurable", {}).get("assistant_id")
    if not assistant_id:
        raise ValueError("`assistant_id` not found in configurable")
    
    memory_namespace = ["memories", assistant_id]
    memory_key = "reflection"
    memories = await store.get(memory_namespace, memory_key)
    
    memories_str = format_reflections(
        memories.get("value") if memories else None,
        {"only_content": True}
    ) if memories else "No reflections found."

    current_artifact_content = None
    if state.artifact and state.artifact.contents:
        current_artifact = state.artifact.contents[-1]
        artifact_content = (
            current_artifact.full_markdown 
            if hasattr(current_artifact, "full_markdown")
            else current_artifact.code
        )
    else:
        artifact_content = "No artifacts generated yet."

    formatted_prompt = FOLLOWUP_ARTIFACT_PROMPT.format(
        artifact_content=artifact_content,
        reflections=memories_str,
        conversation="\n".join(
            f"<{msg.type}>\n{msg.content}\n</{msg.type}>" 
            for msg in state._messages
        )
    )

    response = await small_model.invoke([{"role": "user", "content": formatted_prompt}])
    
    return {
        "messages": [AIMessage(content=response.content)],
        "_messages": [AIMessage(content=response.content)]
    } 