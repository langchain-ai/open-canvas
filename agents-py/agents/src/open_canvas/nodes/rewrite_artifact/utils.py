from typing import Dict, Any, Union
from pydantic import BaseModel
from agents.src.open_canvas.state import OpenCanvasGraphState
from shared.src.types import ArtifactCodeV3, ArtifactMarkdownV3, ProgrammingLanguageOptions
from shared.src.utils.artifacts import get_artifact_content, is_artifact_code_content
from agents.src.open_canvas.prompts import OPTIONALLY_UPDATE_META_PROMPT, UPDATE_ENTIRE_ARTIFACT_PROMPT
from agents.src.open_canvas.nodes.rewrite_artifact.schemas import OptionallyUpdateArtifactMetaSchema

class ValidateStateResult(BaseModel):
    current_artifact_content: Union[ArtifactCodeV3, ArtifactMarkdownV3]
    recent_human_message: Any  # Replace with actual message type

def validate_state(state: OpenCanvasGraphState) -> ValidateStateResult:
    current_artifact_content = None
    if state.artifact:
        current_artifact_content = get_artifact_content(state.artifact)
    if not current_artifact_content:
        raise ValueError("No artifact found")

    recent_human = next(
        (msg for msg in reversed(state._messages) if msg.type == "human"),
        None
    )
    if not recent_human:
        raise ValueError("No recent human message found")

    return ValidateStateResult(
        current_artifact_content=current_artifact_content,
        recent_human_message=recent_human
    )

def build_meta_prompt(tool_call: OptionallyUpdateArtifactMetaSchema) -> str:
    title_section = ""
    if tool_call.title and tool_call.type != "code":
        title_section = f"And its title is (do NOT include this in your response):\n{tool_call.title}"
    
    return OPTIONALLY_UPDATE_META_PROMPT.format(
        artifact_type=tool_call.type,
        artifact_title=title_section
    )

class BuildPromptArgs(BaseModel):
    artifact_content: str
    memories_str: str
    is_new_type: bool
    artifact_meta_tool_call: OptionallyUpdateArtifactMetaSchema

def build_prompt(args: BuildPromptArgs) -> str:
    meta_prompt = ""
    if args.is_new_type:
        meta_prompt = build_meta_prompt(args.artifact_meta_tool_call)
    
    return UPDATE_ENTIRE_ARTIFACT_PROMPT.format(
        artifact_content=args.artifact_content,
        reflections=args.memories_str,
        update_meta_prompt=meta_prompt
    )

class CreateNewArtifactContentArgs(BaseModel):
    artifact_type: str
    state: OpenCanvasGraphState
    current_artifact_content: Union[ArtifactCodeV3, ArtifactMarkdownV3]
    artifact_meta_tool_call: OptionallyUpdateArtifactMetaSchema
    new_content: str

def get_language(
    tool_call: OptionallyUpdateArtifactMetaSchema,
    current_content: Union[ArtifactCodeV3, ArtifactMarkdownV3]
) -> str:
    if tool_call.language:
        return tool_call.language
    if is_artifact_code_content(current_content):
        return current_content.language
    return "other"

def create_new_artifact_content(
    args: CreateNewArtifactContentArgs
) -> Union[ArtifactCodeV3, ArtifactMarkdownV3]:
    base_content = {
        "index": len(args.state.artifact.contents) + 1,
        "title": args.artifact_meta_tool_call.title or args.current_artifact_content.title
    }

    if args.artifact_type == "code":
        return ArtifactCodeV3(
            **base_content,
            type="code",
            language=get_language(args.artifact_meta_tool_call, args.current_artifact_content),
            code=args.new_content
        )
    
    return ArtifactMarkdownV3(
        **base_content,
        type="text",
        full_markdown=args.new_content
    ) 