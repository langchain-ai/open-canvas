import Markdown from "react-markdown";
import { Artifact } from "@/types";

export interface TextRendererProps {
  artifact: Artifact;
}

export function TextRenderer(props: TextRendererProps) {
  return (
    <Markdown className="text-left leading-relaxed overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {props.artifact.content}
    </Markdown>
  );
}
