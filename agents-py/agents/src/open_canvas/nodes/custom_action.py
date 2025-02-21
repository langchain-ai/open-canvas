from typing import Optional, Dict, Any
from uuid import uuid4
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState
from shared.src.types import (
    ArtifactCodeV3,
    ArtifactMarkdownV3,
    ArtifactV3,
    CustomQuickAction,
    Reflections
)
from agents.src.utils import (
    ensure_store_in_config,
    format_reflections,
    get_model_from_config
)
from shared.src.prompts.quick_actions import (
    CUSTOM_QUICK_ACTION_ARTIFACT_CONTENT_PROMPT,
    CUSTOM_QUICK_ACTION_ARTIFACT_PROMPT_PREFIX,
    CUSTOM_QUICK_ACTION_CONVERSATION_CONTEXT,
    REFLECTIONS_QUICK_ACTION_PROMPT
)

def format_messages(messages: list[BaseMessage]) -> str:
    return "\n".join(
        f"<{msg.type}>\n{msg.content}\n</{msg.type}>"
        for msg in messages
    )

async def custom_action(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    if not state.custom_quick_action_id:
        raise ValueError("No custom quick action ID found")

    small_model = await get_model_from_config(config, {"temperature": 0.5})
    
    store = ensure_store_in_config(config)
    assistant_id = config.get("configurable", {}).get("assistant_id")
    user_id = config.get("configurable", {}).get("supabase_user_id")
    
    if not assistant_id:
        raise ValueError("`assistant_id` not found in configurable")
    if not user_id:
        raise ValueError("`user.id` not found in configurable")

    # Parallel fetching of data
    custom_actions_namespace = ["custom_actions", user_id]
    memory_namespace = ["memories", assistant_id]
    
    custom_actions_item, memories = await (
        store.get(custom_actions_namespace, "actions"),
        store.get(memory_namespace, "reflection")
    )

    if not custom_actions_item or "value" not in custom_actions_item:
        raise ValueError("No custom actions found")
    
    action_id = state.custom_quick_action_id
    custom_action = custom_actions_item["value"].get(action_id)
    if not custom_action:
        raise ValueError(f"No custom quick action found for ID {action_id}")

    current_artifact_content = None
    if state.artifact:
        current_artifact_content = state.artifact.contents[-1]  # Simplified from getArtifactContent

    # Build formatted prompt
    formatted_prompt = f"<custom-instructions>\n{custom_action.prompt}\n</custom-instructions>"
    
    if custom_action.include_reflections and memories and "value" in memories:
        reflections_str = format_reflections(memories["value"])
        formatted_prompt += f"\n\n{REFLECTIONS_QUICK_ACTION_PROMPT.format(reflections=reflections_str)}"
    
    if custom_action.include_prefix:
        formatted_prompt = f"{CUSTOM_QUICK_ACTION_ARTIFACT_PROMPT_PREFIX}\n\n{formatted_prompt}"
    
    if custom_action.include_recent_history:
        conv_history = CUSTOM_QUICK_ACTION_CONVERSATION_CONTEXT.format(
            conversation=format_messages(state._messages[-5:])
        )
        formatted_prompt += f"\n\n{conv_history}"

    artifact_content = getattr(current_artifact_content, "code", None) if current_artifact_content else None
    formatted_prompt += f"\n\n{CUSTOM_QUICK_ACTION_ARTIFACT_CONTENT_PROMPT.format(artifact_content=artifact_content or 'No artifacts generated yet.')}"

    # Invoke model
    response = await small_model.invoke([{"role": "user", "content": formatted_prompt}])

    if not current_artifact_content:
        print("No current artifact content found")
        return {}

    # Create new artifact content
    new_content = response.content
    new_artifact_content = {
        **current_artifact_content.dict(),
        "index": len(state.artifact.contents) + 1,
        "code": new_content if isinstance(current_artifact_content, ArtifactCodeV3) else None,
        "full_markdown": new_content if isinstance(current_artifact_content, ArtifactMarkdownV3) else None
    }

    # Create new artifact
    new_artifact = ArtifactV3(
        current_index=len(state.artifact.contents) + 1,
        contents=[*state.artifact.contents, new_artifact_content]
    )

    return {"artifact": new_artifact} 