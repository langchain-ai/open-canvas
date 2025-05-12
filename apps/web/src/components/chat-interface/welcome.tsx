import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive, useThreadRuntime } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useMemo } from "react";
import { TighterText } from "../ui/header";
import { NotebookPen } from "lucide-react";
import { ProgrammingLanguagesDropdown } from "../ui/programming-lang-dropdown";
import { Button } from "../ui/button";

const QUICK_START_PROMPTS_SEARCH = [
  "Analyze the market potential for AI-powered healthcare startups in 2024",
  "Create a due diligence report template for early-stage tech investments",
  "Draft an investment memo for a Series A SaaS company",
  "Write a market analysis of the quantum computing startup ecosystem",
  "Analyze the competitive landscape for fintech startups in emerging markets",
  "Create a summary of recent trends in climate tech investments",
  "Write about the impact of AI regulations on startup valuations",
  "Draft a technology scouting report for enterprise software startups",
  "Analyze the current state of biotech startup funding",
  "Write about emerging opportunities in Web3 infrastructure",
];

const QUICK_START_PROMPTS = [
  // Nordic/European Focus
  "Identify startups in the Nordics that address CO2 emissions",
  "Map the European quantum computing startup ecosystem",
  "Analyze the growth of fintech startups in the Baltic region",
  "List the top 10 climate tech startups in Scandinavia",
  
  // Investment Analysis
  "Analyse the potential of quantum computing as part of an investment thesis",
  "Create an investment memo for a Series A AI startup",
  "Evaluate the market opportunity for robotic process automation",
  "Assess the investment potential of Web3 infrastructure startups",
  
  // Due Diligence & Evaluation
  "Analyse the attached pitch deck with regards to investment attractiveness",
  "Conduct a technical due diligence on this AI startup",
  "Review this startup's go-to-market strategy",
  "Evaluate this company's competitive moat and defensibility",
  
  // Market Analysis
  "Give me the market size for robotic arms",
  "Analyze the TAM for enterprise AI solutions",
  "Research the growth rate of the cybersecurity market",
  "Map the competitive landscape in the biotech sector",
  
  // Technology Trends
  "Make me a list of the hottest technology trends to watch",
  "Identify emerging opportunities in AI infrastructure",
  "Analyze the impact of new AI regulations on startups",
  "Research breakthrough technologies in renewable energy",
  
  // Industry Deep Dives
  "Create a market overview of the healthtech sector",
  "Analyze the future of work and automation trends",
  "Research the evolution of fintech in emerging markets",
  "Map the landscape of enterprise SaaS startups",
  
  // Strategic Analysis
  "Evaluate the potential of this startup's business model",
  "Analyze the scalability of this B2B SaaS solution",
  "Research the market readiness for this new technology",
  "Assess the competitive advantages of this startup"
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
              searchEnabled={props.searchEnabled}
            />
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
