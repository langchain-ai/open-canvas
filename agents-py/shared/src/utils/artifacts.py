from typing import Any, Dict, List, TypeVar, Union, Optional
from shared.src.types import ArtifactCodeV3, ArtifactMarkdownV3, ArtifactV3, Artifact

def is_artifact_code_content(content: Any) -> bool:
    """
    Check if the content is of type ArtifactCodeV3.
    
    Args:
        content: The content to check
        
    Returns:
        bool: True if content is ArtifactCodeV3, False otherwise
    """
    return (
        isinstance(content, dict) 
        and "type" in content 
        and content["type"] == "code"
    )

def is_artifact_markdown_content(content: Any) -> bool:
    """
    Check if the content is of type ArtifactMarkdownV3.
    
    Args:
        content: The content to check
        
    Returns:
        bool: True if content is ArtifactMarkdownV3, False otherwise
    """
    return (
        isinstance(content, dict) 
        and "type" in content 
        and content["type"] == "text"
    )

def is_deprecated_artifact_type(artifact: Any) -> bool:
    """
    Check if the artifact is of deprecated type.
    
    Args:
        artifact: The artifact to check
        
    Returns:
        bool: True if artifact is of deprecated type, False otherwise
    """
    return (
        isinstance(artifact, dict)
        and "currentContentIndex" in artifact
        and isinstance(artifact["currentContentIndex"], int)
    )

def get_artifact_content(artifact: ArtifactV3) -> Union[ArtifactCodeV3, ArtifactMarkdownV3]:
    """
    Get the current content from an artifact.
    
    Args:
        artifact: The artifact to get content from
        
    Returns:
        Union[ArtifactCodeV3, ArtifactMarkdownV3]: The current content
        
    Raises:
        ValueError: If no artifact is found
    """
    if not artifact:
        raise ValueError("No artifact found.")
        
    current_content = next(
        (a for a in artifact.contents if a.index == artifact.current_index),
        None
    )
    
    if not current_content:
        return artifact.contents[-1]
        
    return current_content 