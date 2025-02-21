import uuid
from typing import Dict, Any
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState
from shared.src.types import ArtifactV3, ArtifactCodeV3
from agents.src.utils import get_model_config, get_model_from_config
from agents.src.open_canvas.prompts import (
    ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT,
    ADD_LOGS_TO_CODE_ARTIFACT_PROMPT,
    FIX_BUGS_CODE_ARTIFACT_PROMPT,
    PORT_LANGUAGE_CODE_ARTIFACT_PROMPT
)

async def rewrite_code_artifact_theme(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    model_config = get_model_config(config)
    small_model = await get_model_from_config(config)
    
    current_artifact_content = None
    if state.artifact and state.artifact.contents:
        current_artifact_content = state.artifact.contents[-1]
        if not isinstance(current_artifact_content, ArtifactCodeV3):
            raise ValueError("Current artifact content is not code")

    if not current_artifact_content:
        raise ValueError("No artifact found")

    language_map = {
        "typescript": "TypeScript",
        "javascript": "JavaScript",
        "cpp": "C++",
        "java": "Java",
        "php": "PHP",
        "python": "Python",
        "html": "HTML",
        "sql": "SQL"
    }

    formatted_prompt = ""
    if state.add_comments:
        formatted_prompt = ADD_COMMENTS_TO_CODE_ARTIFACT_PROMPT
    elif state.port_language:
        new_lang = language_map.get(state.port_language, state.port_language)
        formatted_prompt = PORT_LANGUAGE_CODE_ARTIFACT_PROMPT.format(
            new_language=new_lang
        )
    elif state.add_logs:
        formatted_prompt = ADD_LOGS_TO_CODE_ARTIFACT_PROMPT
    elif state.fix_bugs:
        formatted_prompt = FIX_BUGS_CODE_ARTIFACT_PROMPT
    else:
        raise ValueError("No theme selected")

    formatted_prompt = formatted_prompt.format(
        artifact_content=current_artifact_content.code
    )

    response = await small_model.invoke([{"role": "user", "content": formatted_prompt}])
    
    new_content = response.content
    thinking_message = None
    
    if "thinking" in model_config.get("model_name", "").lower():
        # Simple thinking/content separation
        thinking_part, _, content_part = new_content.partition("\n\n")
        thinking_message = AIMessage(
            id=f"thinking-{uuid.uuid4()}",
            content=thinking_part
        )
        new_content = content_part

    new_artifact_content = ArtifactCodeV3(
        index=len(state.artifact.contents) + 1,
        type="code",
        title=current_artifact_content.title,
        language=state.port_language or current_artifact_content.language,
        code=new_content
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