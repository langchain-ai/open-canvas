import { Artifact } from "@/types";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

// Add this import for styling
import styles from "./CodeRenderer.module.css";

export interface CodeRendererProps {
  artifact: Artifact;
}

export function CodeRenderer(props: CodeRendererProps) {
  const [code, setCode] = useState("");

  if (!props.artifact.content) {
    return null;
  }

  return (
    <CodeMirror
      className={`w-full min-h-full ${styles.codeMirrorCustom}`}
      value={props.artifact.content}
      height="800px"
      extensions={[javascript({ jsx: true })]}
      onChange={(c) => setCode(c)}
    />
  );
}
