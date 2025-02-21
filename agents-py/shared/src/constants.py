from typing import List, Dict, Any
from shared.src.types import ProgrammingLanguageOptions

OC_SUMMARIZED_MESSAGE_KEY = "__oc_summarized_message"
OC_HIDE_FROM_UI_KEY = "__oc_hide_from_ui"
OC_WEB_SEARCH_RESULTS_MESSAGE_KEY = "__oc_web_search_results_message"

CONTEXT_DOCUMENTS_NAMESPACE = ["context_documents"]

DEFAULT_INPUTS = {
    "highlighted_code": None,
    "highlighted_text": None,
    "next": None,
    "language": None,
    "artifact_length": None,
    "regenerate_with_emojis": None,
    "reading_level": None,
    "add_comments": None,
    "add_logs": None,
    "fix_bugs": None,
    "port_language": None,
    "custom_quick_action_id": None,
    "web_search_enabled": None,
    "web_search_results": None,
}

PROGRAMMING_LANGUAGES: List[Dict[str, Any]] = [
    {"language": "typescript", "label": "TypeScript"},
    {"language": "javascript", "label": "JavaScript"},
    {"language": "cpp", "label": "C++"},
    {"language": "java", "label": "Java"},
    {"language": "php", "label": "PHP"},
    {"language": "python", "label": "Python"},
    {"language": "html", "label": "HTML"},
    {"language": "sql", "label": "SQL"},
    {"language": "json", "label": "JSON"},
    {"language": "rust", "label": "Rust"},
    {"language": "xml", "label": "XML"},
    {"language": "clojure", "label": "Clojure"},
    {"language": "csharp", "label": "C#"},
    {"language": "other", "label": "Other"},
] 