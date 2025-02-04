import React, { DragEvent } from "react";
import { useComposer, useComposerRuntime } from "@assistant-ui/react";

interface DragAndDropWrapperProps {
  children: React.ReactNode;
}

export function DragAndDropWrapper({
  children,
}: DragAndDropWrapperProps) {
  const disabled = useComposer((c) => !c.isEditing);
  const composerRuntime = useComposerRuntime();
  const attachmentsCount = useComposer((s) => s.attachments.length);

  console.log("Attachments count", attachmentsCount);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("DROP");
    if (!disabled) {
      console.log("Disabled false")
      const files = Array.from(e.dataTransfer.files);
      console.log("Files", files)
      const attachmentAccept = composerRuntime.getAttachmentAccept();
      console.log("xyz")
      composerRuntime.addAttachment(files[0]);
      
      files.forEach(file => {
        console.log("Adding file", file)
        composerRuntime.addAttachment(file);
        // if (attachmentAccept === "*" || file.type.match(attachmentAccept)) {
          
        // }
      });
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}
