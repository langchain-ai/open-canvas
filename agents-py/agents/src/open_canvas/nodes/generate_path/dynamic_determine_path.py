from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from agents.src.open_canvas.prompts import (
    ROUTE_QUERY_PROMPT,
    ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS,
    ROUTE_QUERY_OPTIONS_NO_ARTIFACTS,
    CURRENT_ARTIFACT_PROMPT,
    NO_ARTIFACT_PROMPT
)
from agents.src.utils import (
    format_artifact_content_with_template,
    get_model_from_config,
    create_context_document_messages,
    get_context_documents
)
from shared.src.utils.artifacts import get_artifact_content
from langsmith import traceable

class RouteSchema(BaseModel):
    """Schema for routing response."""
    route: str = Field(
        ..., 
        description="The route to take based on the user's query.",
        enum=["reply_to_general_input", "rewrite_artifact", "generate_artifact"]
    )

@traceable(name="dynamic_determine_path")
async def dynamic_determine_path(
    state: Dict[str, Any],
    new_messages: List[BaseMessage],
    config: RunnableConfig
) -> Dict[str, str]:
    """Determine the next route based on user input and current state."""
    try:
        # Initialize model
        model = await get_model_from_config(config, {"temperature": 0, "is_tool_calling": True})
        
        # Get current artifact content
        current_artifact = state.get("artifact")
        current_artifact_content = get_artifact_content(current_artifact) if current_artifact else None
        
        # Format prompt components
        artifact_options = (
            ROUTE_QUERY_OPTIONS_HAS_ARTIFACTS if current_artifact_content 
            else ROUTE_QUERY_OPTIONS_NO_ARTIFACTS
        )
        
        recent_messages = "\n\n".join(
            f"{msg.type}: {msg.content}" 
            for msg in state.get("_messages", [])[-3:]
        )
        
        current_artifact_prompt = (
            format_artifact_content_with_template(
                CURRENT_ARTIFACT_PROMPT,
                current_artifact_content
            ) if current_artifact_content else NO_ARTIFACT_PROMPT
        )
        
        # Format final prompt
        formatted_prompt = ROUTE_QUERY_PROMPT.format(
            artifact_options=artifact_options,
            recent_messages=recent_messages,
            current_artifact_prompt=current_artifact_prompt
        )

        # Get context documents
        context_docs = await create_context_document_messages(
            documents=await get_context_documents(config),
            provider="openai",  # Simplified for now
            model_name="gpt-4"
        )
        
        # Prepare messages
        messages = [
            *[HumanMessage(content=msg) for msg in context_docs],
            *(new_messages or []),
            HumanMessage(content=formatted_prompt)
        ]

        # Get route from model
        model_with_tools = model.bind_tools(
            tools=[{
                "name": "route_query",
                "description": "Determine the next route based on user input",
                "schema": RouteSchema.model_json_schema()
            }],
            tool_choice="route_query"
        )
        
        response = model_with_tools.invoke(messages)
        
        # Extract route from response
        if response.tool_calls:
            tool_call = response.tool_calls[0]
            if hasattr(tool_call, "function"):
                import json
                args = json.loads(tool_call.function.arguments)
                if args.get("route"):
                    return {"next": args["route"]}

        # Default fallback
        return {"next": "reply_to_general_input"}
        
    except Exception as e:
        print(f"Error in dynamic_determine_path: {e}")
        return {"next": "reply_to_general_input"} 