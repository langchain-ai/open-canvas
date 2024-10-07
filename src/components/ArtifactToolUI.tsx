import { useAssistantToolUI } from "@assistant-ui/react";
import { Button } from "./ui/button";
import { useCallback } from "react";

export const useArtifactToolUI = ({
  setSelectedArtifact,
}: {
  setSelectedArtifact: (artifactId: string) => void;
}) =>
  useAssistantToolUI({
    toolName: "artifact_ui",
    render: useCallback(
      (input) => {
        if (!input.args.title) return null;

        const handleClick = () => {
          setSelectedArtifact(input.toolCallId);
        };

        return (
          <div className="flex w-full items-center justify-start py-3">
            <Button
              onClick={handleClick}
              variant="outline"
              className="min-w-[60%] max-w-full"
            >
              {input.args.title as string}
            </Button>
          </div>
        );
      },
      [setSelectedArtifact]
    ),
  });
