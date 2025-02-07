import {
  CUSTOM_QUICK_ACTION_ARTIFACT_CONTENT_PROMPT,
  CUSTOM_QUICK_ACTION_ARTIFACT_PROMPT_PREFIX,
  CUSTOM_QUICK_ACTION_CONVERSATION_CONTEXT,
  REFLECTIONS_QUICK_ACTION_PROMPT,
} from "@opencanvas/shared/prompts/quick-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CustomQuickAction } from "@opencanvas/shared/types";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FullPromptProps {
  customQuickAction: Omit<CustomQuickAction, "id">;
  setIncludeReflections: Dispatch<SetStateAction<boolean>>;
  setIncludePrefix: Dispatch<SetStateAction<boolean>>;
  setIncludeRecentHistory: Dispatch<SetStateAction<boolean>>;
}

interface HighlightToDeleteTextProps {
  text: string;
  onClick: () => void;
  highlight?: boolean;
  isVisible: boolean;
}

const HighlightToDeleteText = (props: HighlightToDeleteTextProps) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    } else if (props.highlight) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 1250);
      return () => clearTimeout(timer);
    }
  }, [props.highlight]);

  const handleClick = () => {
    setIsDeleting(true);
    setTimeout(() => {
      props.onClick();
    }, 300);
  };

  return (
    <AnimatePresence>
      {props.isVisible && (
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <motion.span
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  layout: { duration: 0.3, ease: "easeInOut" },
                }}
                className={cn(
                  "inline-block cursor-pointer transition-colors duration-300 ease-in-out hover:bg-red-100",
                  isDeleting ? "opacity-0 scale-95" : "opacity-100 scale-100",
                  isHighlighted ? "bg-green-100" : ""
                )}
                onClick={handleClick}
              >
                {props.text}
              </motion.span>
            </TooltipTrigger>
            <TooltipContent>Click to delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
};

export const FullPrompt = (props: FullPromptProps) => {
  const [highlightPrefix, setHighlightPrefix] = useState(
    props.customQuickAction.includePrefix
  );
  const [highlightReflections, setHighlightReflections] = useState(
    props.customQuickAction.includeReflections
  );
  const [highlightRecentHistory, setHighlightRecentHistory] = useState(
    props.customQuickAction.includeRecentHistory
  );

  useEffect(() => {
    setHighlightPrefix(props.customQuickAction.includePrefix);
  }, [props.customQuickAction.includePrefix]);

  useEffect(() => {
    setHighlightReflections(props.customQuickAction.includeReflections);
  }, [props.customQuickAction.includeReflections]);

  useEffect(() => {
    setHighlightRecentHistory(props.customQuickAction.includeRecentHistory);
  }, [props.customQuickAction.includeRecentHistory]);

  return (
    <div className="border-[1px] bg-gray-50 border-gray-200 rounded-md text-wrap overflow-y-auto w-full h-full text-sm px-3 py-2">
      <p className="whitespace-pre-wrap">
        <HighlightToDeleteText
          text={`${CUSTOM_QUICK_ACTION_ARTIFACT_PROMPT_PREFIX}\n\n`}
          onClick={() => props.setIncludePrefix(false)}
          highlight={highlightPrefix}
          isVisible={props.customQuickAction.includePrefix}
        />
        {`<custom-instructions>`}
        <br />
        {props.customQuickAction.prompt}
        <br />
        {`</custom-instructions>`}
        <HighlightToDeleteText
          text={`\n\n${REFLECTIONS_QUICK_ACTION_PROMPT}`}
          onClick={() => props.setIncludeReflections(false)}
          highlight={highlightReflections}
          isVisible={props.customQuickAction.includeReflections}
        />
        <HighlightToDeleteText
          text={`\n\n${CUSTOM_QUICK_ACTION_CONVERSATION_CONTEXT}`}
          onClick={() => props.setIncludeRecentHistory(false)}
          highlight={highlightRecentHistory}
          isVisible={props.customQuickAction.includeRecentHistory}
        />
        {`\n\n`}
        {CUSTOM_QUICK_ACTION_ARTIFACT_CONTENT_PROMPT}
      </p>
    </div>
  );
};
