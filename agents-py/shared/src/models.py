from enum import Enum
from typing import List, Literal, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.documents import Document

class CustomModelConfig(BaseModel):
    provider: str
    temperature_range: Dict[str, float] = Field(
        ...,
        description="Temperature range configuration with min, max, default and current values"
    )
    max_tokens: Dict[str, int] = Field(
        ...,
        description="Max tokens configuration with min, max, default and current values"
    )
    azure_config: Optional[Dict[str, str]] = Field(
        default=None,
        description="Azure-specific configuration parameters"
    )

class ModelConfigurationParams(BaseModel):
    name: str
    label: str
    config: CustomModelConfig
    is_new: bool = False

ArtifactLengthOptions = Literal["shortest", "short", "long", "longest"]
ArtifactType = Literal["code", "text"]

class ArtifactContent(BaseModel):
    index: int
    content: str
    title: str
    type: ArtifactType
    language: str

class Artifact(BaseModel):
    id: str
    contents: List[ArtifactContent]
    current_content_index: int

class ArtifactToolResponse(BaseModel):
    artifact: Optional[str] = None
    title: Optional[str] = None
    language: Optional[str] = None
    type: Optional[str] = None

class RewriteArtifactMetaToolResponse(BaseModel):
    type: str
    title: Optional[str] = None
    language: str

LanguageOptions = Literal["english", "mandarin", "spanish", "french", "hindi"]
ProgrammingLanguageOptions = Literal[
    "typescript", "javascript", "cpp", "java", "php",
    "python", "html", "sql", "json", "rust", "xml",
    "clojure", "csharp", "other"
]
ReadingLevelOptions = Literal["pirate", "child", "teenager", "college", "phd"]

class CodeHighlight(BaseModel):
    start_char_index: int
    end_char_index: int

class ArtifactMarkdownV3(BaseModel):
    index: int
    type: Literal["text"]
    title: str
    full_markdown: str

class ArtifactCodeV3(BaseModel):
    index: int
    type: Literal["code"]
    title: str
    language: ProgrammingLanguageOptions
    code: str

ArtifactV3 = Union[ArtifactMarkdownV3, ArtifactCodeV3]

class TextHighlight(BaseModel):
    full_markdown: str
    markdown_block: str
    selected_text: str

class CustomQuickAction(BaseModel):
    id: str
    title: str
    prompt: str
    include_reflections: bool
    include_prefix: bool
    include_recent_history: bool

class Reflections(BaseModel):
    style_rules: List[str]
    content: List[str]

class ContextDocument(BaseModel):
    name: str
    type: str
    data: str
    metadata: Optional[Dict[str, Any]] = None

class ExaMetadata(BaseModel):
    id: str
    url: str
    title: str
    author: str
    published_date: str
    image: Optional[str] = None
    favicon: Optional[str] = None

SearchResult = Document  # With ExaMetadata in practice

class GraphInput(BaseModel):
    messages: Optional[List[Dict[str, Any]]] = None
    highlighted_code: Optional[CodeHighlight] = None
    highlighted_text: Optional[TextHighlight] = None
    artifact: Optional[ArtifactV3] = None
    next: Optional[str] = None
    language: Optional[LanguageOptions] = None
    artifact_length: Optional[ArtifactLengthOptions] = None
    regenerate_with_emojis: Optional[bool] = None
    reading_level: Optional[ReadingLevelOptions] = None
    add_comments: Optional[bool] = None
    add_logs: Optional[bool] = None
    port_language: Optional[ProgrammingLanguageOptions] = None
    fix_bugs: Optional[bool] = None
    custom_quick_action_id: Optional[str] = None
    web_search_enabled: Optional[bool] = None
    web_search_results: Optional[List[SearchResult]] = None

# Constants
LANGCHAIN_USER_ONLY_MODELS = [
    "o1", "gpt-4o", "claude-3-5-sonnet-latest", 
    "gemini-2.0-flash-thinking-exp-01-21"
]

TEMPERATURE_EXCLUDED_MODELS = ["o1-mini", "o3-mini", "o1"]
NON_STREAMING_TOOL_CALLING_MODELS = ["gemini-2.0-flash-exp", "gemini-1.5-flash"]
NON_STREAMING_TEXT_MODELS = ["o1", "gemini-2.0-flash-thinking-exp-01-21"]
THINKING_MODELS = [
    "accounts/fireworks/models/deepseek-r1",
    "groq/deepseek-r1-distill-llama-70b"
]

# Model lists (simplified for brevity)
OPENAI_MODELS = [
    ModelConfigurationParams(
        name="gpt-4o",
        label="GPT-4o",
        config=CustomModelConfig(
            provider="openai",
            temperature_range={"min": 0, "max": 1, "default": 0.5, "current": 0.5},
            max_tokens={"min": 1, "max": 16384, "default": 4096, "current": 4096}
        ),
        is_new=False
    )
    # Add other models following same pattern
]

ALL_MODELS: List[ModelConfigurationParams] = [
    *OPENAI_MODELS,
    # Add other model groups
]

# Type aliases
ALL_MODEL_NAMES = Literal[
    "gpt-4o", "claude-3-5-sonnet-latest", 
    "accounts/fireworks/models/llama-v3p3-70b-instruct",
    # Add all other model names
]

DEFAULT_MODEL_NAME: ALL_MODEL_NAMES = "gpt-4o-mini"
DEFAULT_MODEL_CONFIG: CustomModelConfig = CustomModelConfig(
    provider="openai",
    temperature_range={"min": 0, "max": 1, "default": 0.5, "current": 0.5},
    max_tokens={"min": 1, "max": 16384, "default": 4096, "current": 4096}
) 