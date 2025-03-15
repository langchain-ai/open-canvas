import {
  UsaFlag,
  ChinaFlag,
  IndiaFlag,
  SpanishFlag,
  FrenchFlag,
} from "@/components/icons/flags";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { GraphInput } from "@opencanvas/shared/types";
import { LanguageOptions } from "@opencanvas/shared/types";
import { motion } from "framer-motion";

export interface TranslateOptionsProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  handleClose: () => void;
}

export function TranslateOptions(props: TranslateOptionsProps) {
  const { streamMessage } = props;

  const handleSubmit = async (language: LanguageOptions) => {
    props.handleClose();
    await streamMessage({
      language,
    });
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "auto", opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="flex flex-col gap-3 items-center w-full overflow-hidden"
    >
      <TooltipIconButton
        tooltip="English"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("english")}
      >
        <UsaFlag />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Mandarin"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("mandarin")}
      >
        <ChinaFlag />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Hindi"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("hindi")}
      >
        <IndiaFlag />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Spanish"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("spanish")}
      >
        <SpanishFlag />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="French"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("french")}
      >
        <FrenchFlag />
      </TooltipIconButton>
    </motion.div>
  );
}
