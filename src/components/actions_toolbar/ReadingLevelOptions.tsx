import {
  Baby,
  GraduationCap,
  PersonStanding,
  School,
  Swords,
} from "lucide-react";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";

export function ReadingLevelOptions() {
  return (
    <div className="flex flex-col gap-3 items-center w-full">
      <TooltipIconButton
        tooltip="PhD"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
      >
        <GraduationCap />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="College"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
      >
        <School />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Teenager"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
      >
        <PersonStanding />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Child"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
      >
        <Baby />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Pirate"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
      >
        <Swords />
      </TooltipIconButton>
    </div>
  );
}
