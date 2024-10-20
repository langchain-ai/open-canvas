import { cleanContent } from "@/lib/normalize_string";
import { ArtifactContent } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import { Dispatch, SetStateAction } from "react";

import styles from "./TextRenderer.module.css";
import { cn } from "@/lib/utils";

export interface TextRenderer {
  artifactContent: ArtifactContent;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  setArtifactContent: (index: number, content: string) => void;
}

export function TextRenderer(props: TextRenderer) {
  return (
    <div
      className="w-full h-full mt-2 flex flex-col border-t-[1px]   border-gray-200 overflow-hidden absolute"
      data-color-mode="light"
    >
      <MDEditor
        preview={props.isEditing ? "edit" : "preview"}
        hideToolbar
        visibleDragbar={false}
        value={cleanContent(props.artifactContent.content)}
        onChange={(v) =>
          props.setArtifactContent(props.artifactContent.index, v || "")
        }
        className={cn(
          "min-h-full border-none",
          styles.mdEditorCustom,
          styles.fullHeightTextArea,
          styles.lightModeOnly
        )}
        height="100%"
      />
    </div>
  );
}
