from typing import Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel, Field
from shared.src.types import ArtifactV3, Reflections
from agents.src.utils import ensure_store_in_config, format_reflections
from agents.src.reflection.state import ReflectionGraphState
from agents.src.reflection.prompts import REFLECT_SYSTEM_PROMPT, REFLECT_USER_PROMPT
from shared.src.utils.artifacts import get_artifact_content, is_artifact_markdown_content
import dotenv
dotenv.load_dotenv()

class ReflectionToolSchema(BaseModel):
    style_rules: list[str] = Field(..., description="The complete new list of style rules and guidelines.")
    content: list[str] = Field(..., description="The complete new list of memories/facts about the user.")

async def reflect(
    state: ReflectionGraphState,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    store = ensure_store_in_config(config)
    assistant_id = config.get("configurable", {}).get("open_canvas_assistant_id")
    if not assistant_id:
        raise ValueError("`open_canvas_assistant_id` not found in configurable")
    
    memory_namespace = ["memories", assistant_id]
    memory_key = "reflection"
    
    # Get existing memories
    memories = await store.get(memory_namespace, memory_key)
    memories_str = format_reflections(memories.get("value")) if memories else "No reflections found."

    # Initialize model with tool
    model = ChatAnthropic(
        model="claude-3-5-sonnet-20240620",
        temperature=0
    ).bind_tools([ReflectionToolSchema], tool_choice="generate_reflections")

    # Get artifact content
    artifact_content = None
    if state.artifact:
        current_artifact = get_artifact_content(state.artifact)
        if is_artifact_markdown_content(current_artifact):
            artifact_content = current_artifact.full_markdown
        else:
            artifact_content = current_artifact.code

    # Format prompts
    system_prompt = REFLECT_SYSTEM_PROMPT.format(
        artifact=artifact_content or "No artifact found.",
        reflections=memories_str
    )
    user_prompt = REFLECT_USER_PROMPT.format(
        conversation="\n\n".join(
            f"<{msg.type}>\n{msg.content}\n</{msg.type}>" for msg in state.messages
        )
    )

    # Invoke model
    response = await model.invoke([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ])

    # Process response
    if not response.tool_calls:
        raise ValueError("Reflection tool call failed")
    
    tool_call = response.tool_calls[0]
    new_memories = {
        "style_rules": tool_call["args"].get("styleRules", []),
        "content": tool_call["args"].get("content", [])
    }

    # Save to store
    await store.put(memory_namespace, memory_key, new_memories)
    return {}

# Create and configure the graph
builder = StateGraph(ReflectionGraphState)
builder.add_node("reflect", reflect)
builder.add_edge(START, "reflect")
graph = builder.compile()
graph.name = "reflection" 