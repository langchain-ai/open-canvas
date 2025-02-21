import uuid
from typing import Dict, Any
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState
from agents.src.utils import (
    get_model_config,
    get_model_from_config,
    get_formatted_reflections,
    create_context_document_messages,
    is_using_o1_mini_model,
    optionally_get_system_prompt_from_config
)
from agents.src.open_canvas.nodes.rewrite_artifact.update_meta import optionally_update_artifact_meta
from agents.src.open_canvas.nodes.rewrite_artifact.utils import (
    validate_state,
    build_prompt,
    create_new_artifact_content
)
from shared.src.utils.artifacts import is_artifact_markdown_content
from shared.src.utils.thinking import (
    extract_thinking_and_response_tokens,
    is_thinking_model
)

async def rewrite_artifact(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    model_config = get_model_config(config)
    model_name = model_config.get("model_name")
    
    # Initialize model
    small_model = await get_model_from_config(config)
    small_model_with_config = small_model.with_config(
        {"run_name": "rewrite_artifact_model_call"}
    )
    
    # Get reflections and validate state
    memories_str = await get_formatted_reflections(config)
    validated = validate_state(state)
    current_artifact = validated.current_artifact_content
    recent_human = validated.recent_human_message

    # Get meta updates
    meta_tool_call = await optionally_update_artifact_meta(state, config)
    artifact_type = meta_tool_call.get("type", current_artifact.type)
    is_new_type = artifact_type != current_artifact.type

    # Get artifact content
    if is_artifact_markdown_content(current_artifact):
        artifact_content = current_artifact.full_markdown
    else:
        artifact_content = current_artifact.code

    # Build prompt
    prompt_args = {
        "artifact_content": artifact_content,
        "memories_str": memories_str,
        "is_new_type": is_new_type,
        "artifact_meta_tool_call": meta_tool_call
    }
    formatted_prompt = build_prompt(prompt_args)

    # Prepare system prompt
    user_prompt = optionally_get_system_prompt_from_config(config)
    full_prompt = f"{user_prompt}\n{formatted_prompt}" if user_prompt else formatted_prompt

    # Get context documents
    context_docs = await create_context_document_messages(config)
    is_o1 = is_using_o1_mini_model(config)

    # Invoke model
    response = await small_model_with_config.invoke([
        {"role": "user" if is_o1 else "system", "content": full_prompt},
        *context_docs,
        recent_human
    ])

    # Handle thinking message
    thinking_msg = None
    content = response.content
    if is_thinking_model(model_name):
        thinking, content = extract_thinking_and_response_tokens(content)
        thinking_msg = AIMessage(
            id=f"thinking-{uuid.uuid4()}",
            content=thinking
        )

    # Create new artifact content
    new_content_args = {
        "artifact_type": artifact_type,
        "state": state,
        "current_artifact_content": current_artifact,
        "artifact_meta_tool_call": meta_tool_call,
        "new_content": content
    }
    new_artifact = create_new_artifact_content(new_content_args)

    # Prepare response
    response_data = {
        "artifact": {
            **state.artifact.dict(),
            "current_index": len(state.artifact.contents) + 1,
            "contents": [*state.artifact.contents, new_artifact]
        }
    }
    if thinking_msg:
        response_data.update({
            "messages": [thinking_msg],
            "_messages": [thinking_msg]
        })

    return response_data 