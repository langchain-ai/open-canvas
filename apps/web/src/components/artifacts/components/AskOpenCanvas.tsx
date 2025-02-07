import { Dispatch, FormEvent, forwardRef, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArtifactV3 } from "@opencanvas/shared/types";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { isArtifactCodeContent } from "@opencanvas/shared/utils/artifacts";
import { useToast } from "@/hooks/use-toast";

interface AskOpenCanvasProps {
  isInputVisible: boolean;
  selectionBox: { top: number; left: number };
  setIsInputVisible: (visible: boolean) => void;
  handleSubmitMessage: (inputValue: string) => Promise<void>;
  handleSelectionBoxMouseDown: (e: React.MouseEvent) => void;
  artifact: ArtifactV3;
  selectionIndexes: { start: number; end: number } | undefined;
  handleCleanupState: () => void;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
}

export const AskOpenCanvas = forwardRef<HTMLDivElement, AskOpenCanvasProps>(
  (props, ref) => {
    const { toast } = useToast();

    const {
      isInputVisible,
      selectionBox,
      selectionIndexes,
      inputValue,
      setInputValue,
      setIsInputVisible,
      handleSubmitMessage,
      handleSelectionBoxMouseDown,
      handleCleanupState,
    } = props;

    const handleSubmit = async (
      e:
        | FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      e.preventDefault();

      const artifactContent = props.artifact
        ? getArtifactContent(props.artifact)
        : undefined;
      if (
        !selectionIndexes &&
        artifactContent &&
        isArtifactCodeContent(artifactContent)
      ) {
        toast({
          title: "Selection error",
          description:
            "Failed to get start/end indexes of the selected text. Please try again.",
          duration: 5000,
        });
        handleCleanupState();
        return;
      }

      if (selectionBox && props.artifact) {
        await handleSubmitMessage(inputValue);
      } else {
        toast({
          title: "Selection error",
          description: "Failed to get selection box. Please try again.",
          duration: 5000,
        });
        handleCleanupState();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "absolute bg-white border border-gray-200 shadow-md p-2 flex gap-2",
          isInputVisible ? "rounded-3xl" : "rounded-md"
        )}
        style={{
          top: `${selectionBox.top + 65}px`,
          left: `${selectionBox.left}px`,
          width: isInputVisible ? "400px" : "250px",
          marginLeft: isInputVisible ? "0" : "150px",
        }}
        onMouseDown={handleSelectionBoxMouseDown}
      >
        {isInputVisible ? (
          <form
            onSubmit={handleSubmit}
            className="relative w-full overflow-hidden flex flex-row items-center gap-1"
          >
            <Input
              className="w-full transition-all duration-300 focus:ring-0 ease-in-out p-1 focus:outline-none border-0 focus-visible:ring-0"
              placeholder="Ask Open Canvas..."
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button
              onClick={(e) => handleSubmit(e)}
              type="submit"
              variant="ghost"
              size="icon"
            >
              <CircleArrowUp
                className="cursor-pointer"
                fill="black"
                stroke="white"
                size={30}
              />
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsInputVisible(true)}
            className="transition-all duration-300 ease-in-out w-full"
          >
            Ask Open Canvas
          </Button>
        )}
      </div>
    );
  }
);

AskOpenCanvas.displayName = "AskOpenCanvas";
