import {
  Baby,
  GraduationCap,
  PersonStanding,
  School,
  Swords,
} from "lucide-react";
import { GraphInput } from "@/hooks/use-graph/useGraph";
import { ReadingLevelOptions as ReadingLevelOptionsType } from "@/types";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";

export interface ReadingLevelOptionsProps {
  streamMessage: (input: GraphInput) => Promise<void>;
  handleClose: () => void;
}

export function ReadingLevelOptions(props: ReadingLevelOptionsProps) {
  const handleSubmit = async (readingLevel: ReadingLevelOptionsType) => {
    props.handleClose();
    await props.streamMessage({
      readingLevel,
    });
  };

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      <TooltipIconButton
        tooltip="PhD"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("phd")}
      >
        <GraduationCap />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="College"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("college")}
      >
        <School />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Teenager"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("teenager")}
      >
        <PersonStanding />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Child"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("child")}
      >
        <Baby />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Pirate"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("pirate")}
      >
        <Swords />
      </TooltipIconButton>
    </div>
  );
}
