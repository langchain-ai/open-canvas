import {
  Baby,
  GraduationCap,
  PersonStanding,
  School,
  Swords,
} from "lucide-react";
import { ReadingLevelOptions as ReadingLevelOptionsType } from "@opencanvas/shared/types";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { GraphInput } from "@opencanvas/shared/types";
import { motion } from "framer-motion";

export interface ReadingLevelOptionsProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  handleClose: () => void;
}

export function ReadingLevelOptions(props: ReadingLevelOptionsProps) {
  const { streamMessage } = props;

  const handleSubmit = async (readingLevel: ReadingLevelOptionsType) => {
    props.handleClose();
    await streamMessage({
      readingLevel,
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
        damping: 30
      }}
      className="flex flex-col gap-3 items-center w-full overflow-hidden"
    >
      <TooltipIconButton
        tooltip="PhD"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("phd")}
      >
        <GraduationCap />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="College"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("college")}
      >
        <School />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Teenager"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("teenager")}
      >
        <PersonStanding />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Child"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("child")}
      >
        <Baby />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Pirate"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={200}
        side="left"
        onClick={async () => await handleSubmit("pirate")}
      >
        <Swords />
      </TooltipIconButton>
    </motion.div>
  );
}
