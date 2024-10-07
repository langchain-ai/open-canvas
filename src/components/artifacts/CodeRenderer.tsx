import { Artifact } from "@/types";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";

import styles from "./CodeRenderer.module.css";

export interface CodeRendererProps {
  artifact: Artifact;
}

export function CodeRenderer(props: CodeRendererProps) {
  const [code, setCode] = useState("");

  let extensions: any[] = [];
  if (props.artifact.language === "javascript") {
    extensions = [javascript({ jsx: true, typescript: false })];
  } else if (props.artifact.language === "typescript") {
    extensions = [javascript({ jsx: true, typescript: true })];
  } else if (props.artifact.language === "cpp") {
    extensions = [cpp()];
  } else if (props.artifact.language === "java") {
    extensions = [java()];
  } else if (props.artifact.language === "php") {
    extensions = [php()];
  } else if (props.artifact.language === "python") {
    extensions = [python()];
  }

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
