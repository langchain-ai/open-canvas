import os
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START
from langgraph_sdk import get_client
from pydantic import BaseModel, Field
from shared.src.utils.artifacts import get_artifact_content, is_artifact_markdown_content
from agents.src.thread_title.prompts import TITLE_SYSTEM_PROMPT, TITLE_USER_PROMPT
import dotenv

dotenv.load_dotenv()


class TitleGenerationState(BaseModel):
    messages: list[BaseMessage] = Field(..., description="Chat history to generate title for")
    artifact: Any = Field(None, description="Generated artifact if exists")

async def generate_title(
    state: TitleGenerationState,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    thread_id = config.get("configurable", {}).get("open_canvas_thread_id")
    if not thread_id:
        raise ValueError("open_canvas_thread_id not found in configurable")

    # Initialize model with tool
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0).bind_tools(
        [{
            "name": "generate_title",
            "description": "Generate a concise title for the conversation.",
            "schema": {
                "title": {"type": "string", "description": "The generated title for the conversation."}
            }
        }],
        tool_choice="generate_title"
    )

    # Get artifact content
    artifact_content = None
    if state.artifact:
        current_artifact = get_artifact_content(state.artifact)
        if is_artifact_markdown_content(current_artifact):
            artifact_content = current_artifact.full_markdown
        else:
            artifact_content = current_artifact.code

    # Format prompts
    artifact_context = f"An artifact was generated during this conversation:\n\n{artifact_content}" if artifact_content else "No artifact was generated during this conversation."
    conversation = "\n\n".join(
        f"<{msg.type}>\n{msg.content}\n</{msg.type}>" for msg in state.messages
    )
    user_prompt = TITLE_USER_PROMPT.format(
        conversation=conversation,
        artifact_context=artifact_context
    )

    # Invoke model
    response = await model.invoke([
        {"role": "system", "content": TITLE_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt}
    ])

    # Process response
    if not response.tool_calls:
        raise ValueError("Title generation tool call failed")
    title = response.tool_calls[0]["args"]["title"]

    # Update thread metadata using langgraph_sdk
    client = get_client(url=f"http://localhost:{os.getenv('PORT', '8000')}")
    await client.threads.update(thread_id, {
        "metadata": {
            "thread_title": title
        }
    })

    return {}

# Create and configure the graph
builder = StateGraph(TitleGenerationState)
builder.add_node("title", generate_title)
builder.add_edge(START, "title")
graph = builder.compile()
graph.name = "thread_title" 