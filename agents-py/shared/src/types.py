from typing import List, Literal, Optional, Union, Dict, Any, TypedDict
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
    model_name: Optional[str] = None
    config: CustomModelConfig
    is_new: bool

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

class ArtifactV3(BaseModel):
    current_index: int
    contents: List[Union[ArtifactMarkdownV3, ArtifactCodeV3]]

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

# Instead of Document[ExaMetadata], create a custom document class
class SearchResult(Document):
    class Metadata(TypedDict):
        title: str
        url: str
        content: str
        score: float  # Tavily returns relevance score
        source_type: str  # Type of source (webpage, news, etc.)
        created_at: Optional[str] = None  # Publication date if available
        author: Optional[str] = None
        image_url: Optional[str] = None
        favicon_url: Optional[str] = None

    metadata: Metadata

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