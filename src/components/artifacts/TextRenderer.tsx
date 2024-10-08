import { Artifact } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import styles from "./TextRenderer.module.css";

export function TextRenderer({
  artifact,
  isEditing,
  setIsEditing,
}: {
  artifact: Artifact;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}) {
  const [value, setValue] = useState("");
  const hasSetInitial = useRef(false);

  useEffect(() => {
    if (!hasSetInitial.current) {
      if (artifact.title === "Quickstart text") {
        setIsEditing(true);
      } else {
        setValue(artifact.content);
      }
      hasSetInitial.current = true;
    }
  }, [artifact.content]);

  return (
    <div className="w-full h-full mt-2 flex flex-col border-[1px] border-gray-200 rounded-2xl overflow-hidden">
      <MDEditor
        preview={isEditing ? "edit" : "preview"}
        hideToolbar
        visibleDragbar={false}
        value={value}
        onChange={(v) => setValue(v || "")}
        className={`min-h-full border-none ${styles.mdEditorCustom} ${styles.fullHeightTextArea}`}
        height="100%"
      />
    </div>
  );
}
