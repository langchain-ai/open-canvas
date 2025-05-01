import { ArtifactCodeV3 } from "@opencanvas/shared/types";
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { xml } from "@codemirror/lang-xml";
import { clojure } from "@nextjournal/lang-clojure";
import { csharp } from "@replit/codemirror-lang-csharp";
import styles from "./CodeRenderer.module.css";
import { cleanContent } from "@/lib/normalize_string";
import { cn } from "@/lib/utils";
import { CopyText } from "./components/CopyText";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { useGraphContext } from "@/contexts/GraphContext";
import { motion } from "framer-motion";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { PanelRightOpen, PanelRightClose } from "lucide-react";
import { CodePreviewer } from "./CodePreviewer";
export interface CodeRendererProps {
  editorRef: MutableRefObject<EditorView | null>;
  isHovering: boolean;
}

const getLanguageExtension = (language: string) => {
  switch (language) {
    case "javascript":
      return javascript({ jsx: true, typescript: false });
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "cpp":
      return cpp();
    case "java":
      return java();
    case "php":
      return php();
    case "python":
      return python();
    case "html":
      return html();
    case "sql":
      return sql();
    case "json":
      return json();
    case "rust":
      return rust();
    case "xml":
      return xml();
    case "clojure":
      return clojure();
    case "csharp":
      return csharp();
    default:
      return [];
  }
};

export interface ToggleCodePreviewProps {
  isCodePreviewVisible: boolean;
  setIsCodePreviewVisible: Dispatch<SetStateAction<boolean>>;
  codePreviewDisabled: boolean;
  isStreaming: boolean;
}

function ToggleCodePreview({
  isCodePreviewVisible,
  setIsCodePreviewVisible,
  codePreviewDisabled,
}: ToggleCodePreviewProps) {
  const tooltipContent = codePreviewDisabled
      ? "Code preview is only supported for valid React code"
      : `${isCodePreviewVisible ? "Hide" : "Show"} code preview`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipIconButton
        tooltip={tooltipContent}
        variant="outline"
        delayDuration={400}
        disabled={codePreviewDisabled}
        onClick={() => setIsCodePreviewVisible((p) => !p)}
      >
        {isCodePreviewVisible ? (
          <PanelRightClose className="w-5 h-5 text-gray-600" />
        ) : (
          <PanelRightOpen className="w-5 h-5 text-gray-600" />
        )}
      </TooltipIconButton>
    </motion.div>
  );
}

export function CodeRendererComponent(props: Readonly<CodeRendererProps>) {
  const { graphData } = useGraphContext();
  const {
    artifact,
    isStreaming,
    updateRenderedArtifactRequired,
    firstTokenReceived,
    setArtifactContent,
    setUpdateRenderedArtifactRequired,
  } = graphData;
  const [isCodePreviewVisible, setIsCodePreviewVisible] = useState(false);

  useEffect(() => {
    if (updateRenderedArtifactRequired) {
      setUpdateRenderedArtifactRequired(false);
    }
  }, [updateRenderedArtifactRequired]);

  useEffect(() => {
    if (isStreaming) {
      setIsCodePreviewVisible(false);
    }
  }, [isStreaming]);

  if (!artifact) {
    return null;
  }

  const artifactContent = getArtifactContent(artifact) as ArtifactCodeV3;
  const extensions = [getLanguageExtension(artifactContent.language)];

  if (!artifactContent.code) {
    return null;
  }

  const isEditable = !isStreaming;

  return (
    <motion.div layout className="flex flex-row w-full overflow-hidden">
      <style jsx global>{`
        .pulse-code .cm-content {
          animation: codePulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes codePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
      <motion.div
        layout
        className="relative overflow-hidden"
        animate={{
          flex: isCodePreviewVisible ? 0.5 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {props.isHovering && (
          <div className="absolute flex gap-2 top-2 right-4 z-10">
            <CopyText currentArtifactContent={artifactContent} />
            {!isStreaming && <ToggleCodePreview
              isCodePreviewVisible={isCodePreviewVisible}
              setIsCodePreviewVisible={setIsCodePreviewVisible}
              codePreviewDisabled={!artifactContent.isValidReact}
              isStreaming={isStreaming}
            />}
          </div>
        )}
        <CodeMirror
          editable={isEditable}
          className={cn(
            "w-full min-h-full",
            styles.codeMirrorCustom,
            isStreaming && !firstTokenReceived ? "pulse-code" : ""
          )}
          value={cleanContent(artifactContent.code)}
          height="800px"
          extensions={extensions}
          onChange={(c) => setArtifactContent(artifactContent.index, c)}
          onCreateEditor={(view) => {
            props.editorRef.current = view;
          }}
        />
      </motion.div>
      {!isStreaming && artifactContent.isValidReact && (
        <CodePreviewer
          artifact={artifactContent}
          isExpanded={isCodePreviewVisible}
        />
      )}
    </motion.div>
  );
}

export const CodeRenderer = React.memo(CodeRendererComponent);
