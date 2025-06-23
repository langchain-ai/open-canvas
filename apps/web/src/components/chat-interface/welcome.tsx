import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive, useThreadRuntime } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useMemo } from "react";
import { TighterText } from "../ui/header";
import { NotebookPen } from "lucide-react";
import { ProgrammingLanguagesDropdown } from "../ui/programming-lang-dropdown";
import { Button } from "../ui/button";

const QUICK_START_PROMPTS_SEARCH = [
  "Summarize the key differences between Production Sharing Agreements (PSAs) and Concession Agreements in the oil & gas sector.",
  "Provide an overview of the regulatory framework for offshore wind energy projects in the North Sea.",
  "Explain the legal concept of 'take-or-pay' in long-term natural gas supply contracts.",
  "What are the typical environmental permits required for building a new LNG terminal in the US?",
  "Outline the standard contractual liabilities for a driller in an offshore Exploration & Production (E&P) project.",
  "Summarize recent changes to the 'New Gas Law' in Brazil and their impact on midstream contracts.",
  "Explain the principle of 'priority of dispatch' for renewable energy sources in the Spanish electricity market.",
  "What are the main legal challenges for cross-border electricity transmission projects in South America?",
  "Describe the role and authority of the Federal Energy Regulatory Commission (FERC) in the United States.",
  "Outline the key legal components of a standard Power Purchase Agreement (PPA).",
];

const QUICK_START_PROMPTS = [
  "Analyze this Power Purchase Agreement (PPA) and identify all non-standard risk clauses.",
  "Extract all key dates, financial figures, and obligations from this pipeline construction contract into a table.",
  "Review the 'Limitation of Liability' clause in this document and compare it against New York law market standards.",
  "Generate a risk report on this Joint Operating Agreement (JOA), focusing on environmental and decommissioning liabilities.",
  "Summarize the termination clauses and list the specific conditions for 'Termination for Convenience'.",
  "Check this services agreement for compliance with standard data protection regulations like GDPR and LGPD.",
  "Identify any inconsistencies between the main body of this agreement and its technical annexes.",
  "Analyze the 'Force Majeure' clause to determine if it covers events like pandemics and cyber-attacks.",
  "Extract all insurance and indemnity requirements from this drilling services contract.",
  "Review the change of law provisions in this public utility concession agreement.",
  "Draft a standard Mutual Non-Disclosure Agreement (NDA) suitable for an oil & gas exploration joint venture.",
  "Write a 'Force Majeure' clause that specifically includes pandemics and cyberattacks, to be governed by English law.",
  "Create a 'Change of Law' clause that fairly balances risk between a public utility and a project developer.",
  "Draft an email to a counterparty proposing amendments to the 'Indemnity' section of an attached agreement.",
  "Generate three alternative wordings for a 'Limitation of Liability' clause, from most to least protective.",
  "Write a standard addendum to extend the term of a service agreement by one year.",
  "Draft a Letter of Intent (LOI) for a joint venture in the renewable energy sector in Brazil.",
  "Create a boilerplate 'Governing Law and Jurisdiction' clause for a contract based in Spain.",
  "Draft a basic 'Confidentiality' clause that survives the termination of the agreement for 5 years.",
  "Write a formal notice of contract breach based on a failure to meet a payment deadline.",
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
            className="text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl flex items-center justify-center gap-2 w-[250px] h-[64px]"
            onClick={() => props.handleQuickStart("text")}
          >
            New Markdown
            <NotebookPen />
          </Button>
          <ProgrammingLanguagesDropdown handleSubmit={handleLanguageSubmit} />
        </div>
      </div>
      <div className="flex flex-col gap-6 mt-2 w-full">
        <p className="text-gray-600 text-sm">or with a message</p>
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
          <Avatar className="mx-auto h-20 w-20">
            <AvatarImage src="/ClauseOS_AVATAR.jpeg" alt="ClauseOS Avatar" />
            <AvatarFallback>LC</AvatarFallback>
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
