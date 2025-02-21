from typing import Optional, Dict, Any
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState
from shared.src.types import ArtifactV3
from agents.src.utils import (
    get_model_from_config,
    is_using_o1_mini_model,
    format_artifact_content,
    get_formatted_reflections,
    
)

from shared.src.utils.artifacts import get_artifact_content

from agents.src.open_canvas.nodes.rewrite_artifact.schemas import OptionallyUpdateArtifactMetaSchema
from agents.src.open_canvas.prompts import GET_TITLE_TYPE_REWRITE_ARTIFACT

async def optionally_update_artifact_meta(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Optional[Dict[str, Any]]:
    try:
        # Initialize model with tool calling
        model = await get_model_from_config(config, {"is_tool_calling": True})
        model_with_tool = model.bind_tools(
            [OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA],
            tool_choice="optionally_update_artifact_meta"
        )

        # Get reflections and format prompt
        reflections = await get_formatted_reflections(config)
        current_artifact = get_artifact_content(state.artifact) if state.artifact else None
        if not current_artifact:
            return None

        prompt = GET_TITLE_TYPE_REWRITE_ARTIFACT.format(
            artifact=format_artifact_content(current_artifact, shorten=True),
            reflections=reflections
        )

        # Find recent human message
        recent_human = next(
            (msg for msg in reversed(state._messages) if msg.type == "human"),
            None
        )
        if not recent_human:
            return None

        # Prepare messages
        is_o1 = is_using_o1_mini_model(config)
        messages = [
            {"role": "user" if is_o1 else "system", "content": prompt},
            recent_human
        ]

        # Get response
        response = await model_with_tool.invoke(messages)
        return response.tool_calls[0].args if response.tool_calls else None

    except Exception as e:
        print(f"Error updating artifact meta: {e}")
        return None 