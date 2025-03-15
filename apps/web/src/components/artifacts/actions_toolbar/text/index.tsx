import { useEffect, useRef, useState } from "react";
import { Languages, BookOpen, SlidersVertical, SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadingLevelOptions } from "./ReadingLevelOptions";
import { TranslateOptions } from "./TranslateOptions";
import { LengthOptions } from "./LengthOptions";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { MagicPencilSVG } from "@/components/icons/magic_pencil";
import { GraphInput } from "@opencanvas/shared/types";
import { AnimatePresence, motion } from "framer-motion";

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
  const [clickedOption, setClickedOption] = useState<string | null>(null);
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

  const handleMouseEnter = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.isTextSelected) return;
    setIsExpanded(true);
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExpanded(false);
    setActiveOption(null);
  };

  const handleOptionClick = async (
    event: React.MouseEvent,
    optionId: string
  ) => {
    event.stopPropagation();
    setClickedOption(optionId);

    if (optionId === "addEmojis") {
      setTimeout(async () => {
        setIsExpanded(false);
        setActiveOption(null);
        await streamMessage({
          regenerateWithEmojis: true,
        });
        setClickedOption(null);
      }, 1000);
    } else {
      setActiveOption(optionId);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setActiveOption(null);
  };

  return (
    <motion.div
      ref={toolbarRef}
      animate={{
        height: isExpanded ? "auto" : 48,
        borderRadius: isExpanded ? "24px" : "24px",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="fixed bottom-4 right-4 flex flex-col items-center justify-center bg-white border-[1px] border-gray-200"
      onClick={toggleExpand}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            className="flex flex-col gap-3 items-center w-full py-4 px-1"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
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
                    className="transition-colors w-[36px] h-[36px] relative overflow-hidden"
                    delayDuration={200}
                    side="left"
                    onClick={async (e) => await handleOptionClick(e, option.id)}
                  >
                    {clickedOption === option.id && (
                      <motion.div
                        className="absolute inset-0 bg-black"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10",
                        clickedOption === option.id && "text-white"
                      )}
                    >
                      {option.icon}
                    </span>
                  </TooltipIconButton>
                ))}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            className="flex items-center justify-center w-full h-full"
          >
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
              side="left"
            >
              <MagicPencilSVG
                className={cn(
                  "w-[26px] h-[26px]",
                  props.isTextSelected
                    ? "text-gray-400"
                    : "hover:text-gray-900 transition-colors"
                )}
              />
            </TooltipIconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
