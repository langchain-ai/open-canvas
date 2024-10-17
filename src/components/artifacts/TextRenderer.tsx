import { Artifact, TextArtifactEditMode } from "@/types";
import MDEditor, { PreviewType } from "@uiw/react-md-editor";
import { Dispatch, SetStateAction } from "react";
import { cleanContent } from "@/lib/normalize_string";

import styles from "./TextRenderer.module.css";

export interface TextRenderer {
  artifact: Artifact;
  setArtifactContent: (id: string, content: string) => void;
  editMode: TextArtifactEditMode;
  setEditMode: Dispatch<SetStateAction<TextArtifactEditMode>>;
}

function getEditMode(editMode: TextArtifactEditMode): PreviewType {
  const hasPreview = editMode.includes("preivew")
  const hasEdit = editMode.includes("edit")
  if (hasPreview && hasEdit) {
    return "live"
  } else if (hasPreview) {
    return "preview"
  } 
  return "edit"
}

export function TextRenderer(props: TextRenderer) {
  const { editMode } = props;
  // 同时存在preview/edit=>live
  return (
    <div
      className="w-full h-full mt-2 flex  flex-col border-[1px] border-gray-200 rounded-2xl overflow-hidden"
      data-color-mode="light"
    >
      <MDEditor
        preview={getEditMode(editMode)}
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
