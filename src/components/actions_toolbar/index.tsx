import { useEffect, useRef, useState } from "react";
import {
  Languages,
  Plus,
  BookOpen,
  SlidersVertical,
  SmilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadingLevelOptions } from "./ReadingLevelOptions";
import { TranslateOptions } from "./TranslateOptions";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { LengthOptions } from "./LengthOptions";

type ToolbarOption = {
  id: string;
  tooltip: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

const toolbarOptions: ToolbarOption[] = [
  {
    id: "translate",
    tooltip: "Translate",
    icon: <Languages className="w-[26px] h-[26px]" />,
    component: <TranslateOptions />,
  },
  {
    id: "readingLevel",
    tooltip: "Reading level",
    icon: <BookOpen className="w-[26px] h-[26px]" />,
    component: <ReadingLevelOptions />,
  },
  {
    id: "adjustLength",
    tooltip: "Adjust the length",
    icon: <SlidersVertical className="w-[26px] h-[26px]" />,
    component: <LengthOptions />,
  },
  {
    id: "addEmojis",
    tooltip: "Add emojis",
    icon: <SmilePlus className="w-[26px] h-[26px]" />,
    component: null,
  },
];

export function ActionsToolbar() {
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
    setIsExpanded(!isExpanded);
    setActiveOption(null);
  };

  const handleOptionClick = (event: React.MouseEvent, optionId: string) => {
    event.stopPropagation();
    if (optionId === "addEmojis") {
      console.log("emoji");
      setIsExpanded(false);
      setActiveOption(null);
    } else {
      setActiveOption(optionId);
    }
  };

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "fixed bottom-4 right-4 transition-all duration-300 ease-in-out text-black flex flex-col items-center justify-center",
        isExpanded
          ? "w-fit-content min-h-fit rounded-3xl"
          : "w-12 h-12 rounded-full"
      )}
      onClick={toggleExpand}
    >
      {isExpanded ? (
        <div className="flex flex-col gap-3 items-center w-full border-[1px] border-gray-200 rounded-3xl py-4 px-3">
          {activeOption && activeOption !== "addEmojis"
            ? toolbarOptions.find((option) => option.id === activeOption)
                ?.component
            : toolbarOptions.map((option) => (
                <TooltipIconButton
                  key={option.id}
                  tooltip={option.tooltip}
                  variant="ghost"
                  className="transition-colors w-[36px] h-[36px]"
                  delayDuration={400}
                  onClick={(e) => handleOptionClick(e, option.id)}
                >
                  {option.icon}
                </TooltipIconButton>
              ))}
        </div>
      ) : (
        <TooltipIconButton
          tooltip="Writing tools"
          variant="ghost"
          className="transition-colors w-[36px] h-[36px] p-0 rounded-full"
          delayDuration={400}
        >
          <Plus className="w-[26px] h-[26px]" />
        </TooltipIconButton>
      )}
    </div>
  );
}
