import { ProgrammingLanguageOptions } from "@/types";
import { ThreadPrimitive, useThreadRuntime } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC } from "react";
import { TighterText } from "../ui/header";
import { NotebookPen } from "lucide-react";
import { ProgrammingLanguagesDropdown } from "../ui/programming-lang-dropdown";
import { Button } from "../ui/button";

interface QuickStartButtonsProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
}

const QuickStartPrompts = () => {
  const threadRuntime = useThreadRuntime();

  const handleClick = (text: string) => {
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text }],
    });
  };

  return (
    <div className="flex flex-col w-full gap-2 text-gray-700">
      <div className="flex gap-2 w-full">
        <Button
          onClick={(e) =>
            handleClick((e.target as HTMLButtonElement).textContent || "")
          }
          variant="outline"
          className="flex-1"
        >
          <TighterText>Write me a TODO app in React</TighterText>
        </Button>
        <Button
          onClick={(e) =>
            handleClick((e.target as HTMLButtonElement).textContent || "")
          }
          variant="outline"
          className="flex-1"
        >
          <TighterText>
            Explain why the sky is blue in a short essay
          </TighterText>
        </Button>
      </div>
      <div className="flex gap-2 w-full">
        <Button
          onClick={(e) =>
            handleClick((e.target as HTMLButtonElement).textContent || "")
          }
          variant="outline"
          className="flex-1"
        >
          <TighterText>
            Help me draft an email to my professor Craig
          </TighterText>
        </Button>
        <Button
          onClick={(e) =>
            handleClick((e.target as HTMLButtonElement).textContent || "")
          }
          variant="outline"
          className="flex-1"
        >
          <TighterText>Write a web scraping program in Python</TighterText>
        </Button>
      </div>
    </div>
  );
};

const QuickStartButtons = (props: QuickStartButtonsProps) => {
  const handleLanguageSubmit = (language: ProgrammingLanguageOptions) => {
    props.handleQuickStart("code", language);
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full">
      <div className="flex flex-col gap-6">
        <p className="text-gray-600 text-sm">Start with a blank canvas</p>
        <div className="flex flex-row gap-1 items-center justify-center w-full">
          <Button
            variant="outline"
            className="transition-colors text-gray-600 flex items-center justify-center gap-2 w-[250px] h-[64px]"
            onClick={() => props.handleQuickStart("text")}
          >
            <TighterText>New Markdown</TighterText>
            <NotebookPen />
          </Button>
          <ProgrammingLanguagesDropdown handleSubmit={handleLanguageSubmit} />
        </div>
      </div>
      <div className="flex flex-col gap-6 mt-2 w-full">
        <p className="text-gray-600 text-sm">or with a message</p>
        <QuickStartPrompts />
        {props.composer}
      </div>
    </div>
  );
};

interface ThreadWelcomeProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
}

export const ThreadWelcome: FC<ThreadWelcomeProps> = (
  props: ThreadWelcomeProps
) => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex items-center justify-center mt-16 w-full">
        <div className="text-center max-w-3xl w-full">
          <Avatar className="mx-auto">
            <AvatarImage src="/lc_logo.jpg" alt="LangChain Logo" />
            <AvatarFallback>LC</AvatarFallback>
          </Avatar>
          <TighterText className="mt-4 text-lg font-medium">
            What would you like to write today?
          </TighterText>
          <div className="mt-8 w-full">
            <QuickStartButtons
              composer={props.composer}
              handleQuickStart={props.handleQuickStart}
            />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
