import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { GraphInput } from "@/contexts/GraphContext";
import { ReadingLevelOptions as ReadingLevelOptionsType } from "@/types";
import { HumanMessage } from "@langchain/core/messages";
import {
  Baby,
  GraduationCap,
  PersonStanding,
  School,
  Swords,
} from "lucide-react";

export interface ReadingLevelOptionsProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  handleClose: () => void;
  setMessages: React.Dispatch<React.SetStateAction<HumanMessage[]>>;
}

export function ReadingLevelOptions(props: ReadingLevelOptionsProps) {
  const { streamMessage } = props;

  const handleSubmit = async (readingLevel: ReadingLevelOptionsType) => {
    props.handleClose();
    const levelMap = {
      phd: "PhD level",
      college: "college level",
      teenager: "teenager level",
      child: "child level",
      pirate: "pirate speak",
    };
    props.setMessages((prevMessages) => [
      ...prevMessages,
      new HumanMessage(
        `Rewrite my artifact to be at a ${levelMap[readingLevel]}`
      ),
    ]);
    await streamMessage({
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
