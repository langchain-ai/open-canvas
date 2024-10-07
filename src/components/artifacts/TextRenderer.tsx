import { Artifact } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import { useCallback, useEffect, useState } from "react";

export interface TextRendererProps {
  artifact: Artifact;
}

export function TextRenderer(props: TextRendererProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(props.artifact.content);
  }, [props.artifact.content]);

  const handleEdit = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const newValue = event.currentTarget.innerText;
    setValue(newValue);
  }, []);

  return (
    <div
      className="w-full h-full"
      contentEditable
      onInput={handleEdit}
      suppressContentEditableWarning
    >
      <MDEditor
        value={value}
        preview="preview"
        hideToolbar
        previewOptions={{
          components: {
            p: "div",
          },
        }}
      />
    </div>
  );
}
