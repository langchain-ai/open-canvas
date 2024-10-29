import { ThreadPrimitive } from "@assistant-ui/react";
import { ArrowDownIcon, SquarePen } from "lucide-react";
import { Dispatch, FC, SetStateAction } from "react";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { ProgrammingLanguageOptions } from "@/types";
import { User } from "@supabase/supabase-js";
import ModelSelector from "./model-selector";
import { ReflectionsDialog } from "../reflections-dialog/ReflectionsDialog";
import { ThreadHistory } from "./thread-history";
import { TighterText } from "../ui/header";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";
import { ThreadWelcome } from "./welcome";
import { Composer } from "./composer";
import { AssistantMessage, UserMessage } from "./messages";
import { useToast } from "@/hooks/use-toast";
import { useGraph } from "@/hooks/use-graph/useGraph";
import { useThread } from "@/hooks/useThread";
import { useLangSmithLinkToolUI } from "../tool-hooks/LangSmithLinkToolUI";

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

export interface ThreadProps {
  user: User;
  hasChatStarted: boolean;
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  setChatStarted: Dispatch<SetStateAction<boolean>>;
  switchSelectedThreadCallback: (thread: ThreadType) => void;
}

export const Thread: FC<ThreadProps> = (props: ThreadProps) => {
  const {
    user,
    setChatStarted,
    hasChatStarted,
    handleQuickStart,
    switchSelectedThreadCallback,
  } = props;
  const { toast } = useToast();
  const { clearState } = useGraph();
  const { createThread, modelName, setModelName } = useThread();

  useLangSmithLinkToolUI();

  const handleCreateThread = async () => {
    setModelName(modelName);
    clearState();
    const thread = await createThread(modelName, user.id);
    setChatStarted(true);
    if (!thread) {
      toast({
        title: "Failed to create a new thread",
        duration: 5000,
        variant: "destructive",
      });
    }
  };

  return (
    <ThreadPrimitive.Root className="flex flex-col h-full">
      <div className="pr-3 pl-6 pt-3 pb-2 flex flex-row gap-4 items-center justify-between">
        <div className="flex items-center justify-start gap-2 text-gray-600">
          <ThreadHistory
            user={user}
            switchSelectedThreadCallback={switchSelectedThreadCallback}
          />
          <TighterText className="text-xl">Open Canvas</TighterText>
          {!hasChatStarted && <ModelSelector />}
        </div>
        {hasChatStarted ? (
          <TooltipIconButton
            tooltip="New chat"
            variant="ghost"
            className="w-fit h-fit p-2"
            delayDuration={400}
            onClick={handleCreateThread}
          >
            <SquarePen className="w-6 h-6 text-gray-600" />
          </TooltipIconButton>
        ) : (
          <div className="flex flex-row gap-2 items-center">
            <ReflectionsDialog />
          </div>
        )}
      </div>
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth bg-inherit px-4 pt-8">
        {!hasChatStarted && (
          <ThreadWelcome
            handleQuickStart={handleQuickStart}
            composer={<Composer />}
          />
        )}
        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            AssistantMessage: AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
      <div className="mt-4 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 px-4">
        <ThreadScrollToBottom />
        <div className="w-full max-w-2xl">
          {hasChatStarted && (
            <div className="flex flex-col space-y-2">
              <ModelSelector />
              <Composer />
            </div>
          )}
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
};
