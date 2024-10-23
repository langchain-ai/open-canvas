import type { Artifact, ArtifactCodeV3, ArtifactMarkdownV3 } from "../types";

export const isArtifactCodeContent = (
  content: unknown
): content is ArtifactCodeV3 => {
  return !!(
    typeof content === "object" &&
    content &&
    "type" in content &&
    content.type === "code"
  );
};

export const isArtifactMarkdownContent = (
  content: unknown
): content is ArtifactMarkdownV3 => {
  return !!(
    typeof content === "object" &&
    content &&
    "type" in content &&
    content.type === "text"
  );
};

export const isDeprecatedArtifactType = (
  artifact: unknown
): artifact is Artifact => {
  return !!(
    typeof artifact === "object" &&
    artifact &&
    "currentContentIndex" in artifact &&
    typeof artifact.currentContentIndex === "number"
  );
};
