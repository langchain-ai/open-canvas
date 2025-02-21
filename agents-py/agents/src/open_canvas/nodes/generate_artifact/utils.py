from agents.src.open_canvas.prompts import NEW_ARTIFACT_PROMPT
from shared.src.types import ArtifactCodeV3, ArtifactMarkdownV3, ProgrammingLanguageOptions
from agents.src.open_canvas.nodes.generate_artifact.schemas import ArtifactToolSchema

def format_new_artifact_prompt(memories_str: str, model_name: str) -> str:
    disable_cot = ""
    if "claude" in model_name.lower():
        disable_cot = "\n\nIMPORTANT: Do NOT perform chain of thought beforehand. Instead, go STRAIGHT to generating the tool response. This is VERY important."
    
    return NEW_ARTIFACT_PROMPT.format(
        reflections=memories_str,
        disable_chain_of_thought=disable_cot
    )

def create_artifact_content(tool_call: ArtifactToolSchema) -> ArtifactCodeV3 | ArtifactMarkdownV3:
    if tool_call.type == "code":
        return ArtifactCodeV3(
            index=1,
            type="code",
            title=tool_call.title,
            code=tool_call.artifact,
            language=tool_call.language or "other"
        )
    
    return ArtifactMarkdownV3(
        index=1,
        type="text",
        title=tool_call.title,
        full_markdown=tool_call.artifact
    ) 