from langgraph.graph import StateGraph, END, START
from agents.src.web_search.state import WebSearchState
from agents.src.web_search.nodes.classify_message import classify_message
from agents.src.web_search.nodes.query_generator import query_generator
from agents.src.web_search.nodes.search import search
import dotenv

dotenv.load_dotenv()


def search_or_end_conditional(state: WebSearchState) -> str:
    """Determine whether to continue with search or end the graph.
    
    Args:
        state: Current state of web search
        
    Returns:
        str: Either "query_generator" or END
    """
    if state.should_search:
        return "query_generator"
    return END

# Initialize graph builder
builder = (
    StateGraph(WebSearchState)
    # Start node & edge
    .add_node("classify_message", classify_message)
    .add_node("query_generator", query_generator)
    .add_node("search", search)
    .add_edge(START, "classify_message")
    # Conditional edges
    .add_conditional_edges(
        "classify_message",
        search_or_end_conditional,
        ["query_generator", END]
    )
    # Edges
    .add_edge("query_generator", "search")
    .add_edge("search", END)
)

# Compile graph
graph = builder.compile()
graph.name = "Web Search Graph" 