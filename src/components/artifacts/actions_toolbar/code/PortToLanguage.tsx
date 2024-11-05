import { ProgrammingLanguageList } from "@/components/ui/programming-lang-dropdown";
import { GraphInput } from "@/contexts/GraphContext";
import { useToast } from "@/hooks/use-toast";
import { ProgrammingLanguageOptions } from "@/types";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

export interface PortToLanguageOptionsProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;

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
  const { streamMessage } = props;
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
    props.setMessages((prevMessages) => [
      ...prevMessages,
      new HumanMessage(`Port the code to ${prettifyLanguage(portLanguage)}`),
    ]);
    await streamMessage({
      portLanguage,
    });
  };

  return <ProgrammingLanguageList handleSubmit={handleSubmit} />;
}
