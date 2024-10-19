"use client";

import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useComposerStore,
  useMessageStore,
  useThreadRuntime,
} from "@assistant-ui/react";
import { useEffect, useState, type FC } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  SendHorizontalIcon,
  SquarePen,
  Code,
  NotebookPen,
} from "lucide-react";
import { MarkdownText } from "@/components/ui/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { useArtifactToolUI } from "./ArtifactToolUI";
import { Thread } from "@langchain/langgraph-sdk";
import { useLangSmithLinkToolUI } from "./LangSmithLinkToolUI";
import { ProgrammingLanguageList } from "./ProgrammingLanguageList";
import { ProgrammingLanguageOptions, Reflections } from "@/types";
import { ReflectionsDialog } from "./reflections-dialog/ReflectionsDialog";
import { ThreadHistory } from "./ThreadHistory";

export interface MyThreadProps {
  setSelectedArtifact: (artifactId: string) => void;
  createThread: () => Promise<Thread>;
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
  userThreads: Thread[];
  switchSelectedThread: (thread: Thread) => void;
  deleteThread: (id: string) => Promise<void>;
}

interface QuickStartButtonsProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
}

const QuickStartButtons = (props: QuickStartButtonsProps) => {
  const [showLanguageList, setShowLanguageList] = useState(false);

  const handleCodeClick = () => {
    setShowLanguageList(true);
  };

  const handleLanguageSubmit = (language: ProgrammingLanguageOptions) => {
    setShowLanguageList(false);
    props.handleQuickStart("code", language);
    return Promise.resolve();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLanguageList &&
        !(event.target as Element).closest(".quickstart-buttons")
      ) {
        setShowLanguageList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageList]);

  return (
    <div className="flex flex-col items-end relative quickstart-buttons">
      <div className="flex flex-row gap-1 items-center">
        <TooltipIconButton
          tooltip="Quickstart: text"
          variant="ghost"
          className="transition-colors w-[36px] h-[36px] text-gray-600"
          delayDuration={400}
          onClick={() => props.handleQuickStart("text")}
        >
          <NotebookPen />
        </TooltipIconButton>
        <TooltipIconButton
          tooltip="Quickstart: code"
          variant="ghost"
          className="transition-colors w-[36px] h-[36px] text-gray-600"
          delayDuration={400}
          onClick={handleCodeClick}
        >
          <Code />
        </TooltipIconButton>
      </div>
      {showLanguageList && (
        <div className="absolute top-full right-0 mt-2 z-10">
          <ProgrammingLanguageList handleSubmit={handleLanguageSubmit} />
        </div>
      )}
    </div>
  );
};

export const MyThread: FC<MyThreadProps> = (props: MyThreadProps) => {
  const { setSelectedArtifact } = props;
  useArtifactToolUI({ setSelectedArtifact });
  useLangSmithLinkToolUI();

  const handleCreateThread = async () => {
    await props.createThread();
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

            <QuickStartButtons handleQuickStart={props.handleQuickStart} />
          </div>
        )}
      </div>
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth bg-inherit px-4 pt-8">
        <MyThreadWelcome />
        <ThreadPrimitive.Messages
          components={{
            UserMessage: MyUserMessage,
            EditComposer: MyEditComposer,
            AssistantMessage: MyAssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>
      <div className="mt-4 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 px-4">
        <MyThreadScrollToBottom />
        <div className="w-full max-w-2xl">
          <MyComposer />
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
};

const MyThreadScrollToBottom: FC = () => {
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

const MyThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex flex-grow basis-full flex-col items-center justify-center">
        <Avatar>
          <AvatarImage src="/lc_logo.jpg" alt="LangChain Logo" />
          <AvatarFallback>LC</AvatarFallback>
        </Avatar>
        <p className="mt-4 font-medium">What would you like to write today?</p>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const MyComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-aui-ring/20 flex w-full flex-wrap items-end rounded-lg border px-2.5 shadow-sm transition-colors ease-in bg-white">
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

const MyUserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
      <div className="bg-muted text-foreground col-start-2 row-start-1 max-w-xl break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
};

const MyComposerSend = () => {
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

const MyEditComposer: FC = () => {
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
        <MyComposerSend />
      </div>
    </ComposerPrimitive.Root>
  );
};

const MyAssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-2xl grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <Avatar className="col-start-1 row-span-full row-start-1 mr-4">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-xl break-words leading-7">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
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
