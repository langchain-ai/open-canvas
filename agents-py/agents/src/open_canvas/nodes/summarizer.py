import os
from typing import Dict, Any
from langgraph_sdk import get_client
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.state import OpenCanvasGraphState

async def summarizer(
    state: OpenCanvasGraphState,
    config: RunnableConfig
) -> Dict[str, Any]:
    thread_id = config.get("configurable", {}).get("thread_id")
    if not thread_id:
        raise ValueError("Missing thread_id in summarizer config")

    client = get_client(url=f"http://localhost:{os.getenv('PORT', '8000')}")

    try:
        new_thread = await client.threads.create()
        await client.runs.create(
            thread_id=new_thread.thread_id,
            app_id="summarizer",
            input={
                "messages": state._messages,
                "thread_id": thread_id  # Changed from threadId to snake_case
            }
        )
    except Exception as e:
        print(f"Error in summarizer: {e}")

    return {} 