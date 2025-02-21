from langgraph.graph import StateGraph, END, START
from langgraph.types import Command, Send
from shared.src.constants import DEFAULT_INPUTS
from agents.src.open_canvas.state import OpenCanvasGraphState
from agents.src.utils import create_ai_message_from_web_results
from typing import Union
# Import all nodes
from agents.src.open_canvas.nodes.generate_path.index import generate_path
from agents.src.open_canvas.nodes.generate_artifact.index import generate_artifact
from agents.src.open_canvas.nodes.rewrite_artifact.index import rewrite_artifact
from agents.src.open_canvas.nodes.reply_to_general_input import reply_to_general_input
from agents.src.open_canvas.nodes.rewrite_artifact_theme import rewrite_artifact_theme
from agents.src.open_canvas.nodes.rewrite_code_artifact_theme import rewrite_code_artifact_theme
from agents.src.open_canvas.nodes.update_artifact import update_artifact
from agents.src.open_canvas.nodes.update_highlighted_text import update_highlighted_text
from agents.src.open_canvas.nodes.custom_action import custom_action
from agents.src.open_canvas.nodes.generate_followup import generate_followup
from agents.src.open_canvas.nodes.reflect import reflect as reflect_node
from agents.src.open_canvas.nodes.generate_title import generate_title as generate_title_node
from agents.src.open_canvas.nodes.summarizer import summarizer
from agents.src.web_search.index import graph as web_search_graph

# ~ 4 chars per token, max tokens of 75000
CHARACTER_MAX = 300000

def route_node(state: dict) -> Send:
    """Route to next node based on state.
    
    Args:
        state: Current state dictionary
        
    Returns:
        Send: Next node to route to
    """
    if not state.get("next"):
        raise ValueError("'next' state field not set")
    return Send(state["next"], {**state})

def clean_state(_: dict) -> dict:
    """Reset state to default inputs.
    
    Args:
        _: Unused state parameter
        
    Returns:
        dict: Default input state
    """
    return {**DEFAULT_INPUTS}

def simple_token_calculator(state: dict) -> str:
    """Calculate if message length exceeds token limit.
    
    Args:
        state: Current state
        
    Returns:
        str: 'summarizer' if over limit, END otherwise
    """
    total_chars = 0
    for msg in state.get("_messages", []):
        if isinstance(msg.content, str):
            total_chars += len(msg.content)
        else:
            total_chars += sum(len(c.get("text", "")) for c in msg.content if "text" in c)
    return "summarizer" if total_chars > CHARACTER_MAX else END

def conditionally_generate_title(state: dict) -> str:
    """Route to title generation if appropriate.
    
    Args:
        state: Current state
        
    Returns:
        str: Next node to route to
    """
    if len(state.get("messages", [])) > 2:
        return simple_token_calculator(state)
    return "generate_title"

def route_post_web_search(state: dict) -> Union[Command, Send]:
    """Route after web search based on results.
    
    Args:
        state: Current state
        
    Returns:
        Union[Command, Send]: Next routing command
    """
    # Check if artifact exists and has more than one content
    artifact = state.get("artifact", {})
    includes_artifacts = len(artifact.get("contents", [])) > 1

    if not state.get("web_search_results"):
        return Send(
            "rewrite_artifact" if includes_artifacts else "generate_artifact",
            {**state, "web_search_enabled": False}
        )

    web_search_msg = create_ai_message_from_web_results(state["web_search_results"])
    return Command(
        goto="rewrite_artifact" if includes_artifacts else "generate_artifact",
        update={
            "web_search_enabled": False,
            "messages": [web_search_msg],
            "_messages": [web_search_msg]
        }
    )

# Initialize graph builder
builder = (
    StateGraph(OpenCanvasGraphState)
    # Start node & edge
    .add_node("generatePath", generate_path)
    .add_edge(START, "generatePath")
    # Nodes
    .add_node("replyToGeneralInput", reply_to_general_input)
    .add_node("rewriteArtifact", rewrite_artifact)
    .add_node("rewriteArtifactTheme", rewrite_artifact_theme)
    .add_node("rewriteCodeArtifactTheme", rewrite_code_artifact_theme)
    .add_node("updateArtifact", update_artifact)
    .add_node("updateHighlightedText", update_highlighted_text)
    .add_node("generateArtifact", generate_artifact)
    .add_node("customAction", custom_action)
    .add_node("generateFollowup", generate_followup)
    .add_node("cleanState", clean_state)
    .add_node("reflect", reflect_node)
    .add_node("generateTitle", generate_title_node)
    .add_node("summarizer", summarizer)
    .add_node("webSearch", web_search_graph)
    .add_node("routePostWebSearch", route_post_web_search)
    # Initial router
    .add_conditional_edges(
        "generatePath",
        route_node,
        [
            "updateArtifact",
            "rewriteArtifactTheme", 
            "rewriteCodeArtifactTheme",
            "replyToGeneralInput",
            "generateArtifact",
            "rewriteArtifact",
            "customAction",
            "updateHighlightedText",
            "webSearch",
        ]
    )
    # Edges
    .add_edge("generateArtifact", "generateFollowup")
    .add_edge("updateArtifact", "generateFollowup")
    .add_edge("updateHighlightedText", "generateFollowup")
    .add_edge("rewriteArtifact", "generateFollowup")
    .add_edge("rewriteArtifactTheme", "generateFollowup")
    .add_edge("rewriteCodeArtifactTheme", "generateFollowup")
    .add_edge("customAction", "generateFollowup")
    .add_edge("webSearch", "routePostWebSearch")
    # End edges
    .add_edge("replyToGeneralInput", "cleanState")
    # Only reflect if an artifact was generated/updated
    .add_edge("generateFollowup", "reflect")
    .add_edge("reflect", "cleanState")
    .add_conditional_edges(
        "cleanState",
        conditionally_generate_title,
        [END, "generateTitle", "summarizer"]
    )
    .add_edge("generateTitle", END)
    .add_edge("summarizer", END)
)

# Compile graph
graph = builder.compile()
graph.name = "open_canvas"