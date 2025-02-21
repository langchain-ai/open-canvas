from typing import Optional, List, Dict, Any
import uuid
from langchain_core.messages import HumanMessage
from agents.src.utils import get_model_from_config
from shared.src.types import SearchResult
from shared.src.constants import OC_WEB_SEARCH_RESULTS_MESSAGE_KEY
from langchain_community.document_loaders import FireCrawlLoader
import asyncio
from langsmith import traceable


PROMPT = """You're an advanced AI assistant.
You have been tasked with analyzing the user's message and determining if the user wants the contents of the URL included in their message included in their prompt.
You should ONLY answer 'true' if it is explicitly clear the user included the URL in their message so that its contents would be included in the prompt, otherwise, answer 'false'

Here is the user's message:
<message>
{message}
</message>

Now, given their message, determine whether or not they want the contents of that webpage to be included in the prompt."""

SCHEMA = {
    "name": "determine_include_url_contents",
    "description": "Whether or not the user's message indicates the contents of the URL should be included in the prompt.",
    "schema": {
        "type": "object",
        "properties": {
            "shouldIncludeUrlContents": {
                "type": "boolean",
                "description": "Whether or not to include the contents of the URL in the prompt."
            }
        },
        "required": ["shouldIncludeUrlContents"]
    }
}

@traceable(name="fetch_url_contents")
async def fetch_url_contents(url: str) -> Dict[str, str]:
    """Fetch contents from a URL using FireCrawl."""
    loader = FireCrawlLoader(
        url=url,
        mode="scrape",
        params={"formats": ["markdown"]}
    )
    docs = await loader.load()
    return {
        "url": url,
        "pageContent": docs[0].page_content if docs else ""
    }

@traceable(name="include_url_contents")
async def include_url_contents(
    message: HumanMessage,
    urls: List[str]
) -> Optional[HumanMessage]:
    """Process URLs in message and optionally include their contents.
    
    Args:
        message: The user's message
        urls: List of URLs found in the message
        
    Returns:
        Optional[HumanMessage]: Modified message with URL contents if needed
    """
    try:
        # Format prompt with message content
        formatted_prompt = PROMPT.format(message=message.content)

        # Initialize model with tools
        model = await get_model_from_config(
            {"model_name": "gpt-4o-mini", "model_provider": "azure_openai"},
            {"temperature": 0}
        )
        model_with_tools = model.bind_tools(
            tools=[SCHEMA],
            tool_choice="determine_include_url_contents"
        )

        # Get model's decision
        result = await model_with_tools.invoke([
            {"role": "user", "content": formatted_prompt}
        ])

        # Check if we should include URL contents
        args = result.tool_calls[0].args if result.tool_calls else None
        if not args or not args.get("shouldIncludeUrlContents"):
            return None

        # Fetch and process URL contents
        url_contents = await asyncio.gather(*[
            fetch_url_contents(url) for url in urls
        ])

        # Transform the prompt with URL contents
        transformed_prompt = message.content
        for content in url_contents:
            transformed_prompt = transformed_prompt.replace(
                content["url"],
                f'<page-contents url="{content["url"]}">\n{content["pageContent"]}\n</page-contents>'
            )

        # Return modified message
        return HumanMessage(
            content=transformed_prompt,
            additional_kwargs={
                **message.additional_kwargs,
                "id": f"web-content-{uuid.uuid4()}"
            }
        )

    except Exception as e:
        print(f"Failed to handle included URLs: {e}")
        return None 