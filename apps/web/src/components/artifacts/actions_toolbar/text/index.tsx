import { useEffect, useRef, useState } from "react";
import { BookOpen, SlidersVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadingLevelOptions } from "./ReadingLevelOptions";
import { LengthOptions } from "./LengthOptions";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { MagicPencilSVG } from "@/components/icons/magic_pencil";
import { GraphInput } from "@opencanvas/shared/types";

interface SharedComponentProps {
  onClose: () => void;
  handleClose: () => void;
  streamMessage: (input: GraphInput) => Promise<void>;
}

interface ToolbarOption {
  id: string;
  tooltip: string;
  icon: React.ReactNode;
  component: ((props: SharedComponentProps) => React.ReactNode) | null;
}

interface TextActionsToolbarProps {
  streamMessage: (input: GraphInput) => Promise<void>;
  isTextSelected?: boolean;
}

const toolbarOptions: ToolbarOption[] = [
  {
    id: "readingLevel",
    tooltip: "Reading level",
    icon: <BookOpen className="w-[26px] h-[26px]" />,
    component: (props: SharedComponentProps) => (
      <ReadingLevelOptions {...props} />
    ),
  },
  {
    id: "adjustLength",
    tooltip: "Adjust the length",
    icon: <SlidersVertical className="w-[26px] h-[26px]" />,
    component: (props: SharedComponentProps) => <LengthOptions {...props} />,
  },
];

export function TextActionsToolbar(props: TextActionsToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const { streamMessage, isTextSelected } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
    optionId: string
  ) => {
    event.stopPropagation();
    setActiveOption(optionId);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setActiveOption(null);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 flex flex-col items-center justify-center transition-all duration-300 ease-in-out"
      style={{
        width: isExpanded ? "250px" : "40px",
        minHeight: isExpanded ? "fit-content" : "40px",
        borderRadius: isExpanded ? "24px" : "8px",
        backgroundColor: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {isExpanded ? (
        <div className="flex flex-col gap-3 items-center w-full border-[1px] border-gray-200 rounded-3xl py-4 px-3">
          {activeOption
            ? toolbarOptions
                .find((option) => option.id === activeOption)
                ?.component?.({
                  onClose: handleClose,
                  handleClose: handleClose,
                  streamMessage,
                })
            : toolbarOptions.map((option) => (
                <TooltipIconButton
                  key={option.id}
                  tooltip={option.tooltip}
                  variant="ghost"
                  className={cn(
                    "w-[40px] h-[40px]",
                    isTextSelected ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                  )}
                  onClick={(e) => !isTextSelected && handleOptionClick(e, option.id)}
                >
                  {option.icon}
                </TooltipIconButton>
              ))}
        </div>
      ) : (
        <TooltipIconButton
          tooltip={isTextSelected ? "Actions disabled while text is selected" : "Actions"}
          variant="ghost"
          className={cn(
            "w-[40px] h-[40px]",
            isTextSelected ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
          )}
          onClick={() => !isTextSelected && setIsExpanded(true)}
        >
          <MagicPencilSVG />
        </TooltipIconButton>
      )}
    </div>
  );
}

export { TextActionsToolbar as ActionsToolbar };
