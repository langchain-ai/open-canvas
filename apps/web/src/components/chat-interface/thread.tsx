import { useGraphContext } from "@/contexts/GraphContext";
import { useToast } from "@/hooks/use-toast";
import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive } from "@assistant-ui/react";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";
import {
  ArrowDownIcon,
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
} from "lucide-react";
import { Dispatch, FC, SetStateAction } from "react";
import { ReflectionsDialog } from "../reflections-dialog/ReflectionsDialog";
import { useLangSmithLinkToolUI } from "../tool-hooks/LangSmithLinkToolUI";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { TighterText } from "../ui/header";
import { Composer } from "./composer";
import { AssistantMessage, UserMessage } from "./messages";
import ModelSelector from "./model-selector";
import { ThreadHistory } from "./thread-history";
import { ThreadWelcome } from "./welcome";
import { useUserContext } from "@/contexts/UserContext";
import { useThreadContext } from "@/contexts/ThreadProvider";
import { useAssistantContext } from "@/contexts/AssistantContext";
import { cn } from "@/lib/utils";

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
  userId: string | undefined;
  hasChatStarted: boolean;
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  setChatStarted: Dispatch<SetStateAction<boolean>>;
  switchSelectedThreadCallback: (thread: ThreadType) => void;
  searchEnabled: boolean;
  chatCollapsed: boolean;
  setChatCollapsed: (c: boolean) => void;
}

export const Thread: FC<ThreadProps> = (props: ThreadProps) => {
  const {
    setChatStarted,
    hasChatStarted,
    handleQuickStart,
    switchSelectedThreadCallback,
    chatCollapsed,
    setChatCollapsed,
  } = props;
  const { toast } = useToast();
  const {
    graphData: { clearState, runId, feedbackSubmitted, setFeedbackSubmitted },
  } = useGraphContext();
  const { selectedAssistant } = useAssistantContext();
  const {
    modelName,
    setModelName,
    modelConfig,
    setModelConfig,
    modelConfigs,
    setThreadId,
  } = useThreadContext();
  const { user } = useUserContext();

  // Render the LangSmith trace link
  useLangSmithLinkToolUI();

  const handleNewSession = async () => {
    if (!user) {
      toast({
        title: "User not found",
        description: "Failed to create thread without user",
        duration: 5000,
        variant: "destructive",
      });
      return;
    }

    // Remove the threadId param from the URL
    setThreadId(null);

    setModelName(modelName);
    setModelConfig(modelName, modelConfig);
    clearState();
    setChatStarted(false);
  };

  return (
    <ThreadPrimitive.Root className="flex flex-col h-full">
      <div
        className={cn(
          "pr-3 pl-6 pt-3 pb-2 flex flex-col gap-2 transition-all duration-300 ease-in-out",
          chatCollapsed && "pl-2 w-[60px]"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start gap-2 text-gray-600">
            {!chatCollapsed && (
              <ThreadHistory
                switchSelectedThreadCallback={switchSelectedThreadCallback}
              />
            )}
            {/* Only show title when expanded */}
            {!chatCollapsed && (
              <TighterText className="text-xl transition-opacity duration-300 ease-in-out">
                Open Canvas
              </TighterText>
            )}
          </div>
          {hasChatStarted ? (
            <div className="flex flex-row gap-2 items-center">
              <TooltipIconButton
                tooltip={chatCollapsed ? "Expand Chat" : "Collapse Chat"}
                variant="ghost"
                className={cn(
                  "w-8 h-8 transition-all duration-300 ease-in-out",
                  // Add margin when collapsed
                  chatCollapsed && "mx-2"
                )}
                delayDuration={400}
                onClick={() => setChatCollapsed(!chatCollapsed)}
              >
                {chatCollapsed ? (
                  <PanelRightClose className="text-gray-600" />
                ) : (
                  <PanelRightOpen className="text-gray-600" />
                )}
              </TooltipIconButton>
              {!chatCollapsed && (
                <TooltipIconButton
                  tooltip="New chat"
                  variant="ghost"
                  className="w-8 h-8 transition-opacity duration-300 ease-in-out"
                  delayDuration={400}
                  onClick={handleNewSession}
                >
                  <SquarePen className="text-gray-600" />
                </TooltipIconButton>
              )}
            </div>
          ) : (
            !chatCollapsed && (
              <ReflectionsDialog selectedAssistant={selectedAssistant} />
            )
          )}
        </div>
        {!chatCollapsed && (
          <div className="transition-opacity duration-300 ease-in-out">
            <ModelSelector
              modelName={modelName}
              setModelName={setModelName}
              modelConfig={modelConfig}
              setModelConfig={setModelConfig}
              modelConfigs={modelConfigs}
            />
          </div>
        )}
      </div>

      {!chatCollapsed && (
        <div className="flex flex-col flex-1 transition-opacity duration-300 ease-in-out">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth bg-inherit px-4 pt-8 min-h-0">
            {!hasChatStarted && (
              <ThreadWelcome
                handleQuickStart={handleQuickStart}
                composer={
                  <Composer
                    chatStarted={false}
                    userId={props.userId}
                    searchEnabled={props.searchEnabled}
                  />
                }
                searchEnabled={props.searchEnabled}
              />
            )}
            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserMessage,
                AssistantMessage: (prop) => (
                  <AssistantMessage
                    {...prop}
                    feedbackSubmitted={feedbackSubmitted}
                    setFeedbackSubmitted={setFeedbackSubmitted}
                    runId={runId}
                  />
                ),
              }}
            />
          </ThreadPrimitive.Viewport>
          <div className="mt-4 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 px-4">
            <ThreadScrollToBottom />
            <div className="w-full max-w-2xl">
              {hasChatStarted && (
                <Composer
                  chatStarted={true}
                  userId={props.userId}
                  searchEnabled={props.searchEnabled}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ThreadPrimitive.Root>
  );
};
