import uuid
from typing import List, Optional, Dict, Any
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from shared.src.types import ContextDocument
from agents.src.utils import (
    convert_pdf_to_text,
    create_context_document_messages,
    get_model_config
)
from shared.src.constants import OC_HIDE_FROM_UI_KEY

async def convert_context_document_to_human_message(
    messages: List[HumanMessage],
    config: RunnableConfig
) -> Optional[HumanMessage]:
    if not messages:
        return None
        
    last_message = messages[-1]
    documents = last_message.additional_kwargs.get("documents", [])
    if not documents:
        return None

    context_msgs = await create_context_document_messages(config, documents)
    content = []
    for msg in context_msgs:
        if isinstance(msg.content, list):
            content.extend(msg.content)
        elif isinstance(msg.content, dict):
            content.append(msg.content)
    
    return HumanMessage(
        id=str(uuid.uuid4()),
        content=content,
        additional_kwargs={OC_HIDE_FROM_UI_KEY: True}
    )

async def fix_misformatted_context_doc_message(
    message: HumanMessage,
    config: RunnableConfig
) -> Optional[List[HumanMessage]]:
    if isinstance(message.content, str):
        return None

    model_config = get_model_config(config)
    provider = model_config.get("model_provider")
    new_msg_id = str(uuid.uuid4())
    changes_made = False
    new_content = []

    if provider == "openai":
        for item in message.content:
            if item.get("type") == "document" and item.get("source", {}).get("type") == "base64":
                text = await convert_pdf_to_text(item["source"]["data"])
                new_content.append({"type": "text", "text": text})
                changes_made = True
            elif item.get("type") == "application/pdf":
                text = await convert_pdf_to_text(item.get("data", ""))
                new_content.append({"type": "text", "text": text})
                changes_made = True
            else:
                new_content.append(item)
                
    elif provider == "anthropic":
        for item in message.content:
            if item.get("type") == "application/pdf":
                new_content.append({
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": item.get("data")
                    }
                })
                changes_made = True
            else:
                new_content.append(item)
                
    elif provider == "google-genai":
        for item in message.content:
            if item.get("type") == "document":
                new_content.append({
                    "type": "application/pdf",
                    "data": item.get("source", {}).get("data")
                })
                changes_made = True
            else:
                new_content.append(item)

    if changes_made:
        return [
            HumanMessage(
                id=new_msg_id,
                content=new_content,
                additional_kwargs=message.additional_kwargs
            )
        ]
    return None 