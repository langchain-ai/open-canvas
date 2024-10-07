import { GraphInput } from "@/hooks/useGraph";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { ProgrammingLanguageOptions } from "@/types";

export interface PortToLanguageOptionsProps {
  selectedArtifactId: string | undefined;
  streamMessage: (input: GraphInput) => Promise<void>;
  handleClose: () => void;
}

export function PortToLanguageOptions(props: PortToLanguageOptionsProps) {
  const handleSubmit = async (portLanguage: ProgrammingLanguageOptions) => {
    if (!props.selectedArtifactId) {
      return;
    }
    props.handleClose();
    await props.streamMessage({
      selectedArtifactId: props.selectedArtifactId,
      portLanguage,
    });
  };

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      <TooltipIconButton
        tooltip="PHP"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("php")}
      >
        <p>PHP</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="TypeScript"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("typescript")}
      >
        <p>TypeScript</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="JavaScript"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("javascript")}
      >
        <p>JavaScript</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="C++"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("cpp")}
      >
        <p>C++</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Java"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("java")}
      >
        <p>Java</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Python"
        variant="ghost"
        className="transition-colors w-[36px] h-[36px]"
        delayDuration={400}
        onClick={async () => await handleSubmit("python")}
      >
        <p>Python</p>
      </TooltipIconButton>
    </div>
  );
}
