import { GraphInput } from "@/hooks/use-graph/useGraph";
import { ProgrammingLanguageOptions } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ProgrammingLanguageList } from "@/components/ProgrammingLangDropdown";

export interface PortToLanguageOptionsProps {
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
    case "html":
      return "HTML";
    case "sql":
      return "SQL";
    default:
      return language;
  }
};

export function PortToLanguageOptions(props: PortToLanguageOptionsProps) {
  const { toast } = useToast();

  const handleSubmit = async (portLanguage: ProgrammingLanguageOptions) => {
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
      portLanguage,
    });
  };

  return <ProgrammingLanguageList handleSubmit={handleSubmit} />;
}
