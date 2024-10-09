import { Artifact } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import { Dispatch, SetStateAction } from "react";
import { cleanContent } from "@/lib/normalize_string";

import styles from "./TextRenderer.module.css";

export interface TextRenderer {
  artifact: Artifact;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  setArtifactContent: (id: string, content: string) => void;
}

export function TextRenderer(props: TextRenderer) {
  return (
    <div
      className="w-full h-full mt-2 flex flex-col border-[1px] border-gray-200 rounded-2xl overflow-hidden"
      data-color-mode="light"
    >
      <MDEditor
        preview={props.isEditing ? "edit" : "preview"}
        hideToolbar
        visibleDragbar={false}
        value={cleanContent(props.artifact.content)}
        onChange={(v) => props.setArtifactContent(props.artifact.id, v || "")}
        className={`min-h-full border-none ${styles.mdEditorCustom} ${styles.fullHeightTextArea} ${styles.lightModeOnly}`}
        height="100%"
      />
    </div>
  );
}
