import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive, useThreadRuntime } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useMemo } from "react";
import { TighterText } from "../ui/header";
import { NotebookPen } from "lucide-react";
import { ProgrammingLanguagesDropdown } from "../ui/programming-lang-dropdown";
import { Button } from "../ui/button";

const QUICK_START_PROMPTS_SEARCH = [
  "Summarize the patient's chronic conditions and current management plan",
  "Review recent lab results and highlight any concerning trends",
  "Create a medication reconciliation list with current dosages and frequencies",
  "Analyze vaccination history and identify any overdue immunizations",
  "Review family history for relevant hereditary conditions and risk factors",
  "Summarize recent specialist visits and their recommendations",
  "List allergies and adverse drug reactions with their severity levels",
  "Review recent vital signs and note any significant changes",
  "Analyze preventive care status and due dates for screenings",
  "Summarize social history including lifestyle factors affecting health",
];

const QUICK_START_PROMPTS = [
  "Create a SOAP note for today's follow-up visit",
  "Draft a referral letter to a specialist with relevant history",
  "Generate a patient education handout about diabetes management",
  "Write a prescription refill review with adherence assessment",
  "Create a care plan for managing hypertension",
  "Draft a prior authorization letter for a medication",
  "Write a summary of recent emergency department visits",
  "Create a wellness plan focusing on preventive care",
  "Draft instructions for home blood pressure monitoring",
  "Write a clinical summary for insurance authorization",
  "Create a nutrition plan for a diabetic patient",
  "Summarize recent imaging results and recommendations",
  "Draft a letter addressing work restrictions",
  "Create a follow-up schedule for chronic condition monitoring",
];

function getRandomPrompts(prompts: string[], count: number = 4): string[] {
  return [...prompts].sort(() => Math.random() - 0.5).slice(0, count);
}

interface QuickStartButtonsProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
  searchEnabled: boolean;
}

interface QuickStartPromptsProps {
  searchEnabled: boolean;
}

const QuickStartPrompts = ({ searchEnabled }: QuickStartPromptsProps) => {
  const threadRuntime = useThreadRuntime();

  const handleClick = (text: string) => {
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text }],
    });
  };

  const selectedPrompts = useMemo(
    () =>
      getRandomPrompts(
        searchEnabled ? QUICK_START_PROMPTS_SEARCH : QUICK_START_PROMPTS
      ),
    [searchEnabled]
  );

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {selectedPrompts.map((prompt, index) => (
          <Button
            key={`quick-start-prompt-${index}`}
            onClick={() => handleClick(prompt)}
            variant="outline"
            className="min-h-[60px] w-full flex items-center justify-center p-6 whitespace-normal text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl"
          >
            <p className="text-center break-words text-sm font-normal">
              {prompt}
            </p>
          </Button>
        ))}
      </div>
    </div>
  );
};

const QuickStartButtons = (props: QuickStartButtonsProps) => {
  // const handleLanguageSubmit = (language: ProgrammingLanguageOptions) => {
  //   props.handleQuickStart("code", language);
  // };

  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full">
      {/* <div className="flex flex-col gap-6">
        <p className="text-gray-600 text-sm">Start with a blank canvas</p>
        <div className="flex flex-row gap-1 items-center justify-center w-full">
          <Button
            variant="outline"
            className="text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl flex items-center justify-center gap-2 w-[250px] h-[64px]"
            onClick={() => props.handleQuickStart("text")}
          >
            New Markdown
            <NotebookPen />
          </Button>
          <ProgrammingLanguagesDropdown handleSubmit={handleLanguageSubmit} />
        </div>
      </div> */}
      <div className="flex flex-col gap-6 mt-2 w-full">
        {/* <p className="text-gray-600 text-sm">or with a message</p> */}
        {props.composer}
        <QuickStartPrompts searchEnabled={props.searchEnabled} />
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
  searchEnabled: boolean;
}

export const ThreadWelcome: FC<ThreadWelcomeProps> = (
  props: ThreadWelcomeProps
) => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex items-center justify-center mt-16 w-full">
        <div className="text-center max-w-3xl w-full">
          <Avatar className="mx-auto w-64 h-64">
            <AvatarImage
              src="/credo_logo.gif"
              width={128}
              height={128}
              alt="Credo Logo"
              className="rounded-full object-cover"
            />
            <AvatarFallback>CC</AvatarFallback>
          </Avatar>
          <TighterText className="mt-4 text-lg font-medium">
            What would you like to write today?
          </TighterText>
          <div className="mt-8 w-full">
            <QuickStartButtons
              composer={props.composer}
              handleQuickStart={props.handleQuickStart}
              searchEnabled={props.searchEnabled}
            />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
