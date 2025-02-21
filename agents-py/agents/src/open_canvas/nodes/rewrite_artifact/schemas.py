from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from shared.src.constants import PROGRAMMING_LANGUAGES

class ArtifactType(str, Enum):
    TEXT = "text"
    CODE = "code"

class OptionallyUpdateArtifactMetaSchema(BaseModel):
    type: ArtifactType = Field(
        ...,
        description="The type of the artifact content."
    )
    title: Optional[str] = Field(
        default=None,
        description="The new title to give the artifact. ONLY update this if the user is making a request which changes the subject/topic of the artifact."
    )
    language: str = Field(
        ...,
        description="The language of the code artifact. This should be populated with the programming language if the user is requesting code to be written, or 'other', in all other cases.",
        enum=[lang["language"] for lang in PROGRAMMING_LANGUAGES]
    )

    class Config:
        schema_extra = {
            "description": "Update the artifact meta information, if necessary."
        } 