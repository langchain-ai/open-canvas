import { Artifact, ArtifactContent } from "@/types";

export const getCurrentArtifactContent = (
  artifact: Artifact
): ArtifactContent => {
  const currentContent = artifact.contents.find(
    (a) => a.index === artifact.currentContentIndex
  );
  if (!currentContent) {
    throw new Error("Current content not found.");
  }
  return currentContent;
};
