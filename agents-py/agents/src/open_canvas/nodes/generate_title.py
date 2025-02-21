import os
from typing import Dict, Any
from langgraph_sdk import get_client
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState

async def generate_title(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    if len(state.messages) > 2:
        # Skip if not first human-AI conversation
        return {}

    try:
        lang_graph_client = get_client(url=f"http://localhost:{os.getenv('PORT', '8000')}")

        title_input = {
            "messages": state.messages,
            "artifact": state.artifact.dict() if state.artifact else None
        }
        
        title_config = {
            "configurable": {
                "open_canvas_thread_id": config.get("configurable", {}).get("thread_id")
            }
        }

        # Create new thread for title generation
        new_thread = await lang_graph_client.threads.create()
        
        # Start title generation run in background
        await lang_graph_client.runs.create(
            thread_id=new_thread.thread_id,
            app_id="thread_title",
            input=title_input,
            config=title_config,
            multitask_strategy="enqueue",
            after_seconds=0
        )
        
    except Exception as e:
        print(f"Failed to call generate title graph\n\n{e}")

    return {} 