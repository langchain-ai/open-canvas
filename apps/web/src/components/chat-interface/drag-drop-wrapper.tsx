import React, { DragEvent } from "react";
import { useComposer, useComposerRuntime } from "@assistant-ui/react";
import { useToast } from "@/hooks/use-toast";

interface DragAndDropWrapperProps {
  children: React.ReactNode;
}

export function DragAndDropWrapper({ children }: DragAndDropWrapperProps) {
  const { toast } = useToast();
  const disabled = useComposer((c) => !c.isEditing);
  const composerRuntime = useComposerRuntime();

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

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!disabled) {
      try {
        const files = Array.from(e.dataTransfer.files);
        const attachmentAccept = composerRuntime.getAttachmentAccept();
        const addAttachmentPromises = files.map(async (file) => {
          if (
            attachmentAccept === "*" ||
            attachmentAccept.split(",").some((t) => t.trim() === file.type)
          ) {
            await composerRuntime.addAttachment(file);
          } else {
            toast({
              title: "Incompatible file type",
              description: (
                <div className="flex flex-col gap-1 text-pretty">
                  <p>This file {file.name} is not supported.</p>
                  <p>
                    Received type <span className="font-mono">{file.type}</span>
                    . Must be one of:{" "}
                  </p>
                  <p className="font-mono text-wrap">
                    {attachmentAccept.split(",").join(", ")}
                  </p>
                </div>
              ),
              variant: "destructive",
              duration: 5000,
            });
          }
        });

        await Promise.all(addAttachmentPromises);
      } catch (e) {
        console.error(e);
        toast({
          title: "Error",
          description:
            "Failed to add attachment. This is likely due to an incompatible file type.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } else {
      toast({
        title: "Drag and drop disabled",
        description:
          "Drag and drop is disabled in this mode. Please try again later.",
        duration: 5000,
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
