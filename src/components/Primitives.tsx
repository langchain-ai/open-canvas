"use client";

import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useComposerStore,
  useMessageStore,
  useThreadRuntime,
} from "@assistant-ui/react";
import { useState, type FC } from "react";

import { MarkdownText } from "@/components/ui/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFeedback } from "@/hooks/useFeedback";
import { ProgrammingLanguageOptions, Reflections } from "@/types";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";
import {
  ArrowDownIcon,
  NotebookPen,
  SendHorizontalIcon,
  SquarePen,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useLangSmithLinkToolUI } from "./LangSmithLinkToolUI";
import { ProgrammingLanguagesDropdown } from "./ProgrammingLangDropdown";
import { ReflectionsDialog } from "./reflections-dialog/ReflectionsDialog";
import { ThreadHistory } from "./ThreadHistory";

export interface ThreadProps {
  createThread: () => Promise<ThreadType | undefined>;
  showNewThreadButton: boolean;
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  isLoadingReflections: boolean;
  reflections: (Reflections & { updatedAt: Date }) | undefined;
  handleDeleteReflections: () => Promise<boolean>;
  handleGetReflections: () => Promise<void>;
  isUserThreadsLoading: boolean;
  userThreads: ThreadType[];
  switchSelectedThread: (thread: ThreadType) => void;
  deleteThread: (id: string) => Promise<void>;
  runId: string;
}

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
          Write me a TODO app in React
        </Button>
        <Button
          onClick={(e) =>
            handleClick((e.target as HTMLButtonElement).textContent || "")
          }
          variant="outline"
          className="flex-1"
        >
          Explain why the sky is blue in a short essay
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
          Help me draft an email to my professor Craig
        </Button>
        <Button
          onClick={(e) =>
            handleClick((e.target as HTMLButtonElement).textContent || "")
          }
          variant="outline"
          className="flex-1"
        >
          Write a web scraping program in Python
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
            New Markdown
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

export const Thread: FC<ThreadProps> = (props: ThreadProps) => {
  const { toast } = useToast();

  useLangSmithLinkToolUI();

  const handleCreateThread = async () => {
    const thread = await props.createThread();
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
            isUserThreadsLoading={props.isUserThreadsLoading}
            userThreads={props.userThreads}
            switchSelectedThread={props.switchSelectedThread}
            deleteThread={props.deleteThread}
          />
          <p className="text-xl">Open Canvas</p>
        </div>
        {props.showNewThreadButton ? (
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
            <ReflectionsDialog
              handleGetReflections={props.handleGetReflections}
              isLoadingReflections={props.isLoadingReflections}
              reflections={props.reflections}
              handleDeleteReflections={props.handleDeleteReflections}
            />
          </div>
        )}
      </div>
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth bg-inherit px-4 pt-8">
        {!props.showNewThreadButton && (
          <ThreadWelcome
            handleQuickStart={props.handleQuickStart}
            composer={<Composer />}
          />
        )}
        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: (prop) => (
              <AssistantMessage {...prop} runId={props.runId} />
            ),
          }}
        />
      </ThreadPrimitive.Viewport>
      <div className="mt-4 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 px-4">
        <ThreadScrollToBottom />
        <div className="w-full max-w-2xl">
          {props.showNewThreadButton && <Composer />}
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
};

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

interface ThreadWelcomeProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
}

const ThreadWelcome: FC<ThreadWelcomeProps> = (props: ThreadWelcomeProps) => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex items-center justify-center mt-16 w-full">
        <div className="text-center max-w-3xl w-full">
          <Avatar className="mx-auto">
            <AvatarImage src="/lc_logo.jpg" alt="LangChain Logo" />
            <AvatarFallback>LC</AvatarFallback>
          </Avatar>
          <p className="mt-4 text-lg font-medium">
            What would you like to write today?
          </p>
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

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-aui-ring/20 flex w-full min-h-[64px] flex-wrap items-center rounded-lg border px-2.5 shadow-sm transition-colors ease-in bg-white">
      <ComposerPrimitive.Input
        autoFocus
        placeholder="Write a message..."
        rows={1}
        className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </ComposerPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
      <div className="bg-muted text-foreground col-start-2 row-start-1 max-w-xl break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
};

const ComposerSend = () => {
  const messageStore = useMessageStore();
  const composerStore = useComposerStore();
  const threadRuntime = useThreadRuntime();

  const handleSend = () => {
    const composerState = composerStore.getState();
    const { parentId, message } = messageStore.getState();

    threadRuntime.append({
      parentId,
      role: message.role,
      content: [{ type: "text", text: composerState.text }],
    });
    composerState.cancel();
  };

  return <Button onClick={handleSend}>Save</Button>;
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-2xl flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input
        className="text-foreground flex h-8 w-full resize-none border-none bg-transparent p-4 pb-0 outline-none focus:ring-0"
        // Don't submit on `Enter`, instead add a newline.
        submitOnEnter={false}
      />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerSend />
      </div>
    </ComposerPrimitive.Root>
  );
};

interface AssistantMessageProps {
  runId: string;
}

const AssistantMessage: FC<AssistantMessageProps> = ({ runId }) => {
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-2xl grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <Avatar className="col-start-1 row-span-full row-start-1 mr-4">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-xl break-words leading-7">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        <MessagePrimitive.If lastOrHover assistant>
          <AssistantMessageBar runId={runId} />
        </MessagePrimitive.If>
      </div>
    </MessagePrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};

interface AssistantMessageBarProps {
  runId: string;
}

const AssistantMessageBar = ({ runId }: AssistantMessageBarProps) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex items-center mt-2"
    >
      {feedbackSubmitted ? (
        <div className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-blue-100 text-secondary-foreground hover:bg-blue-100/80">
          Feedback received! Thank you!
        </div>
      ) : (
        <>
          <ActionBarPrimitive.FeedbackPositive asChild>
            <FeedbackButton
              runId={runId}
              setFeedbackSubmitted={setFeedbackSubmitted}
              feedbackValue={1.0}
              icon="thumbs-up"
            />
          </ActionBarPrimitive.FeedbackPositive>
          <ActionBarPrimitive.FeedbackNegative asChild>
            <FeedbackButton
              runId={runId}
              setFeedbackSubmitted={setFeedbackSubmitted}
              feedbackValue={0.0}
              icon="thumbs-down"
            />
          </ActionBarPrimitive.FeedbackNegative>
        </>
      )}
    </ActionBarPrimitive.Root>
  );
};

interface FeedbackButtonProps {
  runId: string;
  setFeedbackSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  feedbackValue: number;
  icon: "thumbs-up" | "thumbs-down";
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  runId,
  setFeedbackSubmitted,
  feedbackValue,
  icon,
}) => {
  const { sendFeedback } = useFeedback();
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      const res = await sendFeedback(runId, "feedback", feedbackValue);
      if (res?.success) {
        setFeedbackSubmitted(true);
      } else {
        toast({
          title: "Failed to submit feedback",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (_) {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={`Give ${icon === "thumbs-up" ? "positive" : "negative"} feedback`}
    >
      {icon === "thumbs-up" ? (
        <ThumbsUpIcon className="size-4" />
      ) : (
        <ThumbsDownIcon className="size-4" />
      )}
    </Button>
  );
};
