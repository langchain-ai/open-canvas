import { Artifact } from "@/types";
import { MutableRefObject } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import styles from "./CodeRenderer.module.css";
import { cleanContent } from "@/lib/normalize_string";
import { html } from "@codemirror/lang-html";
import { sql } from "@codemirror/lang-sql";

export interface CodeRendererProps {
  artifact: Artifact;
  setArtifactContent: (id: string, content: string) => void;
  editorRef: MutableRefObject<EditorView | null>;
}

export function CodeRenderer(props: Readonly<CodeRendererProps>) {
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
  } else if (props.artifact.language === "html") {
    extensions = [html()];
  } else if (props.artifact.language === "sql") {
    extensions = [sql()];
  }

  if (!props.artifact.content) {
    return null;
  }

  return (
    <CodeMirror
      editable={true}
      className={`w-full min-h-full ${styles.codeMirrorCustom}`}
      value={cleanContent(props.artifact.content)}
      height="800px"
      extensions={extensions}
      onChange={(c) => props.setArtifactContent(props.artifact.id, c)}
      onCreateEditor={(view) => {
        props.editorRef.current = view;
      }}
    />
  );
}
