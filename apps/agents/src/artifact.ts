import { ArtifactMarkdownV3, ArtifactCodeV3 } from "@opencanvas/shared/types";
import { isArtifactCodeContent } from "@opencanvas/shared/utils/artifacts";

export const formatArtifactContent = (
  content: ArtifactMarkdownV3 | ArtifactCodeV3,
  shortenContent?: boolean
): string => {
  let artifactContent: string;

  if (isArtifactCodeContent(content)) {
    const codeContent = content as ArtifactCodeV3;
    artifactContent =
      shortenContent && codeContent.code
        ? codeContent.code.slice(0, 500)
        : (codeContent.code ?? "");
  } else {
    const markdownContent = content as ArtifactMarkdownV3;
    artifactContent =
      shortenContent && markdownContent.fullMarkdown
        ? markdownContent.fullMarkdown.slice(0, 500)
        : (markdownContent.fullMarkdown ?? "");
  }

  const title = "title" in content ? content.title : "";
  const type = "type" in content ? content.type : "";

  return `Title: ${title}\nArtifact type: ${type}\nContent: ${artifactContent}`;
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
