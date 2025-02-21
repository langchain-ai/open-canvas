from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from shared.src.constants import PROGRAMMING_LANGUAGES

class ArtifactType(str, Enum):
    CODE = "code"
    TEXT = "text"

class ArtifactToolSchema(BaseModel):
    type: ArtifactType = Field(
        ...,
        description="The content type of the artifact generated."
    )
    language: Optional[str] = Field(
        default=None,
        description="The language/programming language of the artifact generated.\n"
                    "If generating code, it should be one of the options, or 'other'.\n"
                    "If not generating code, the language should ALWAYS be 'other'.",
        enum=[lang["language"] for lang in PROGRAMMING_LANGUAGES]
    )
    is_valid_react: Optional[bool] = Field(
        default=None,
        alias="isValidReact",
        description="Whether or not the generated code is valid React code. Only populate this field if generating code."
    )
    artifact: str = Field(
        ...,
        description="The content of the artifact to generate."
    )
    title: str = Field(
        ...,
        description="A short title to give to the artifact. Should be less than 5 words."
    )

ARTIFACT_TOOL_SCHEMA = ArtifactToolSchema.schema() 