import { Artifact } from "@/types";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";

// Add this import for styling
import styles from "./CodeRenderer.module.css";

export interface CodeRendererProps {
  artifact: Artifact;
}

export function CodeRenderer(props: CodeRendererProps) {
  const [code, setCode] = useState("");

  const extensions = [
    javascript({ jsx: true, typescript: true }),
    cpp(),
    java(),
    php(),
    python(),
  ];

  if (!props.artifact.content) {
    return null;
  }

  return (
    <CodeMirror
      className={`w-full min-h-full ${styles.codeMirrorCustom}`}
      value={props.artifact.content}
      height="800px"
      extensions={extensions}
      onChange={(c) => setCode(c)}
    />
  );
}
