import { GraphInput } from "@/hooks/useGraph";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { ProgrammingLanguageOptions } from "@/types";
import { useToast } from "@/hooks/use-toast";

export interface PortToLanguageOptionsProps {
  selectedArtifactId: string | undefined;
  streamMessage: (input: GraphInput) => Promise<void>;
  handleClose: () => void;
  language: ProgrammingLanguageOptions;
}

const prettifyLanguage = (language: ProgrammingLanguageOptions) => {
  switch (language) {
    case "php":
      return "PHP";
    case "typescript":
      return "TypeScript";
    case "javascript":
      return "JavaScript";
    case "cpp":
      return "C++";
    case "java":
      return "Java";
    case "python":
      return "Python";
    default:
      return language;
  }
};

export function PortToLanguageOptions(props: PortToLanguageOptionsProps) {
  const { toast } = useToast();

  const handleSubmit = async (portLanguage: ProgrammingLanguageOptions) => {
    if (!props.selectedArtifactId) {
      return;
    }
    if (portLanguage === props.language) {
      toast({
        title: "Port language error",
        description: `The code is already in ${prettifyLanguage(portLanguage)}`,
        duration: 5000,
      });
      props.handleClose();
      return;
    }

    props.handleClose();
    await props.streamMessage({
      selectedArtifactId: props.selectedArtifactId,
      portLanguage,
    });
  };

  return (
    <div className="flex flex-col gap-3 items-center w-full text-left">
      <TooltipIconButton
        tooltip="PHP"
        variant="ghost"
        className="transition-colors w-full h-fit"
        delayDuration={400}
        onClick={async () => await handleSubmit("php")}
      >
        <p>PHP</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="TypeScript"
        variant="ghost"
        className="transition-colors w-full h-fit px-1 py-1"
        delayDuration={400}
        onClick={async () => await handleSubmit("typescript")}
      >
        <p>TypeScript</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="JavaScript"
        variant="ghost"
        className="transition-colors w-full h-fit"
        delayDuration={400}
        onClick={async () => await handleSubmit("javascript")}
      >
        <p>JavaScript</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="C++"
        variant="ghost"
        className="transition-colors w-full h-fit"
        delayDuration={400}
        onClick={async () => await handleSubmit("cpp")}
      >
        <p>C++</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Java"
        variant="ghost"
        className="transition-colors w-full h-fit"
        delayDuration={400}
        onClick={async () => await handleSubmit("java")}
      >
        <p>Java</p>
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Python"
        variant="ghost"
        className="transition-colors w-full h-fit"
        delayDuration={400}
        onClick={async () => await handleSubmit("python")}
      >
        <p>Python</p>
      </TooltipIconButton>
    </div>
  );
}
