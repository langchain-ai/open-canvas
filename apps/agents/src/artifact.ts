import { ArtifactMarkdownV3, ArtifactCodeV3 } from "@opencanvas/shared/types";
import { isArtifactCodeContent } from "@opencanvas/shared/utils/artifacts";

export const formatArtifactContent = (
  content: ArtifactMarkdownV3 | ArtifactCodeV3,
  shortenContent?: boolean
): string => {
  let artifactContent: string;

  if (isArtifactCodeContent(content)) {
    artifactContent = shortenContent
      ? content.code?.slice(0, 500)
      : content.code;
  } else {
    artifactContent = shortenContent
      ? content.fullMarkdown?.slice(0, 500)
      : content.fullMarkdown;
  }
  return `Title: ${content.title}\nArtifact type: ${content.type}\nContent: ${artifactContent}`;
};

export const formatArtifactContentWithTemplate = (
  template: string,
  content: ArtifactMarkdownV3 | ArtifactCodeV3,
  shortenContent?: boolean
): string => {
  return template.replace(
    "{artifact}",
    formatArtifactContent(content, shortenContent)
  );
};