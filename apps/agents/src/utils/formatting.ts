import { ArtifactMarkdownV3, ArtifactCodeV3 } from "@opencanvas/shared/types";
import { isArtifactMarkdownContent } from "@opencanvas/shared/utils/artifacts";

export function formatReflections(reflections: any) {
  // implementation
}

export function formatArtifactContent(
  content: ArtifactMarkdownV3 | ArtifactCodeV3,
  shortenContent?: boolean
): string {
  if ('fullMarkdown' in content) {
    return content.fullMarkdown;
  } else if ('code' in content) {
    return content.code;
  } else {
    throw new Error('Unknown content type');
  }
}