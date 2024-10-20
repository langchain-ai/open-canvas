import { ArtifactContent } from "@/types";
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

export interface CodeRendererProps {
  artifactContent: ArtifactContent;
  setArtifactContent: (index: number, content: string) => void;
  editorRef: MutableRefObject<EditorView | null>;
}

export function CodeRenderer(props: Readonly<CodeRendererProps>) {
  let extensions: any[] = [];
  if (props.artifactContent.language === "javascript") {
    extensions = [javascript({ jsx: true, typescript: false })];
  } else if (props.artifactContent.language === "typescript") {
    extensions = [javascript({ jsx: true, typescript: true })];
  } else if (props.artifactContent.language === "cpp") {
    extensions = [cpp()];
  } else if (props.artifactContent.language === "java") {
    extensions = [java()];
  } else if (props.artifactContent.language === "php") {
    extensions = [php()];
  } else if (props.artifactContent.language === "python") {
    extensions = [python()];
  } else if (props.artifactContent.language === "html") {
    extensions = [html()];
  }

  if (!props.artifactContent.content) {
    return null;
  }

  return (
    <CodeMirror
      editable={true}
      className={`w-full min-h-full ${styles.codeMirrorCustom}`}
      value={cleanContent(props.artifactContent.content)}
      height="800px"
      extensions={extensions}
      onChange={(c) => props.setArtifactContent(props.artifactContent.index, c)}
      onCreateEditor={(view) => {
        props.editorRef.current = view;
      }}
    />
  );
}
