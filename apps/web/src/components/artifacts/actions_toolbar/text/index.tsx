import { useEffect, useRef, useState } from "react";
import { Languages, BookOpen, SlidersVertical, SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadingLevelOptions } from "./ReadingLevelOptions";
import { TranslateOptions } from "./TranslateOptions";
import { LengthOptions } from "./LengthOptions";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { MagicPencilSVG } from "@/components/icons/magic_pencil";
import { GraphInput } from "@opencanvas/shared/types";

type SharedComponentProps = {
  streamMessage: (params: GraphInput) => Promise<void>;
  handleClose: () => void;
};

type ToolbarOption = {
  id: string;
  tooltip: string;
  icon: React.ReactNode;
  component: ((props: SharedComponentProps) => React.ReactNode) | null;
};

export interface ActionsToolbarProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  isTextSelected: boolean;
}

const toolbarOptions: ToolbarOption[] = [
  {
    id: "translate",
    tooltip: "Translate",
    icon: <Languages className="w-[26px] h-[26px]" />,
    component: (props: SharedComponentProps) => <TranslateOptions {...props} />,
  },
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
  {
    id: "addEmojis",
    tooltip: "Add emojis",
    icon: <SmilePlus className="w-[26px] h-[26px]" />,
    component: null,
  },
];

export function ActionsToolbar(props: ActionsToolbarProps) {
  const { streamMessage } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setActiveOption(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.isTextSelected) return;
    setIsExpanded(!isExpanded);
    setActiveOption(null);
  };

  const handleOptionClick = async (
    event: React.MouseEvent,
    optionId: string
  ) => {
    event.stopPropagation();
    if (optionId === "addEmojis") {
      setIsExpanded(false);
      setActiveOption(null);
      await streamMessage({
        regenerateWithEmojis: true,
      });
    } else {
      setActiveOption(optionId);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setActiveOption(null);
  };

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "fixed bottom-4 right-4 transition-all duration-300 ease-in-out text-black flex flex-col items-center justify-center bg-white dark:bg-black dark:text-gray-300",
        isExpanded
          ? "w-fit-content min-h-fit rounded-3xl"
          : "w-12 h-12 rounded-full"
      )}
      onClick={toggleExpand}
    >
      {isExpanded ? (
        <div className="flex flex-col gap-3 items-center w-full border-[1px] border-gray-200 rounded-3xl py-4 px-3">
          {activeOption && activeOption !== "addEmojis"
            ? toolbarOptions
                .find((option) => option.id === activeOption)
                ?.component?.({
                  ...props,
                  handleClose,
                })
            : toolbarOptions.map((option) => (
                <TooltipIconButton
                  key={option.id}
                  tooltip={option.tooltip}
                  variant="ghost"
                  className="transition-colors w-[36px] h-[36px]"
                  delayDuration={400}
                  onClick={async (e) => await handleOptionClick(e, option.id)}
                >
                  {option.icon}
                </TooltipIconButton>
              ))}
        </div>
      ) : (
        <TooltipIconButton
          tooltip={
            props.isTextSelected
              ? "Quick actions disabled while text is selected"
              : "Writing tools"
          }
          variant="outline"
          className={cn(
            "transition-colors w-[48px] h-[48px] p-0 rounded-xl",
            props.isTextSelected
              ? "cursor-default opacity-50 text-gray-400 hover:bg-background"
              : "cursor-pointer"
          )}
          delayDuration={400}
        >
          <MagicPencilSVG
            className={cn(
              "w-[26px] h-[26px] dark:text-gray-300",
              props.isTextSelected
                ? "text-gray-400"
                : "hover:text-gray-900 hover:dark:text-gray-400 transition-colors"
            )}
          />
        </TooltipIconButton>
      )}
    </div>
  );
}
