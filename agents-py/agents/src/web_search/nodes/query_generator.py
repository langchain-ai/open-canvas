from typing import Dict, Any
from langchain_anthropic import ChatAnthropic
from datetime import datetime
from agents.src.web_search.state import WebSearchState

QUERY_GENERATOR_PROMPT = """You're a helpful AI assistant tasked with writing a query to search the web.
You're provided with a list of messages between a user and an AI assistant.
The most recent message from the user is the one you should update to be a more search engine friendly query.

Try to keep the new query as similar to the message as possible, while still being search engine friendly.

Here is the conversation between the user and the assistant, in order of oldest to newest:

<conversation>
{conversation}
</conversation>

<additional_context>
{additional_context}
</additional_context>

Respond ONLY with the search query, and nothing else."""

async def query_generator(state: WebSearchState) -> Dict[str, Any]:
    model = ChatAnthropic(
        model="claude-3-5-sonnet-latest",
        temperature=0
    )
    
    # Format additional context
    additional_context = f"The current date is {datetime.now().strftime('%B %d, %Y %I:%M %p')}"
    
    # Format conversation history
    formatted_messages = "\n".join(
        f"{msg.type}: {msg.content}" for msg in state.messages
    )
    
    # Prepare prompt
    prompt = QUERY_GENERATOR_PROMPT.format(
        conversation=formatted_messages,
        additional_context=additional_context
    )
    
    # Invoke model
    response = await model.ainvoke([("user", prompt)])
    
    return {"query": response.content} 