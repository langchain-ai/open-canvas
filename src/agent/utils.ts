import { Artifact } from "../types";

export const formatArtifacts = (
  messages: Artifact[],
  truncate?: boolean
): string =>
  messages
    .map((artifact) => {
      const content = truncate
        ? `${artifact.content.slice(0, 500)}${artifact.content.length > 500 ? "..." : ""}`
        : artifact.content;
      return `Title: ${artifact.title}\nID: ${artifact.id}\nContent: ${content}`;
    })
    .join("\n\n");
