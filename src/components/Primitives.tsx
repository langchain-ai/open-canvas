"use client";

import {
  ActionBarPrimitive,
  AssistantMessageContentProps,
  ComposerPrimitive,
  getExternalStoreMessage,
  MessagePrimitive,
  ThreadAssistantMessage,
  ThreadPrimitive,
  useActionBarEdit,
  useComposerCancel,
  useComposerSend,
  useComposerStore,
  useMessage,
  useMessageStore,
  useThreadActions,
} from "@assistant-ui/react";
import { useCallback, useEffect, useRef, useState, type FC } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  CheckIcon,
  CopyIcon,
  PencilIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { MarkdownText } from "@/components/ui/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { RuleInfoDialog } from "./RuleInfoDialog";
import { BaseMessage } from "@langchain/core/messages";

export interface MyThreadProps extends MyAssistantMessageProps {}

export const MyThread: FC<MyThreadProps> = (props: MyThreadProps) => {
  return (
    <ThreadPrimitive.Root className="bg-background h-full">
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
        <MyThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: MyUserMessage,
            EditComposer: MyEditComposer,
            AssistantMessage: useCallback(
              (messageProps: AssistantMessageContentProps) => (
                <MyAssistantMessage {...messageProps} onCopy={props.onCopy} />
              ),
              [props.onCopy]
            ),
          }}
        />

        <div className="sticky bottom-0 mt-4 flex w-full max-w-2xl flex-grow flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <MyThreadScrollToBottom />
          <MyComposer />
        </div>
      </ThreadPrimitive.Viewport>
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
    <ComposerPrimitive.Root className="focus-within:border-aui-ring/20 flex w-full flex-wrap items-end rounded-lg border px-2.5 shadow-sm transition-colors ease-in">
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
      <MyUserActionBar />

      <div className="bg-muted text-foreground col-start-2 row-start-1 max-w-xl break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
};

const MyUserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="col-start-1 mr-3 mt-2.5 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const MyComposerSend = (props: {
  setInfoDialogOpen: (open: boolean) => void;
}) => {
  const messageStore = useMessageStore();
  const composerStore = useComposerStore();
  const threadActions = useThreadActions();

  const handleSend = () => {
    const composerState = composerStore.getState();
    const { parentId, message } = messageStore.getState();

    threadActions.append({
      parentId,
      role: message.role,
      content: [{ type: "text", text: composerState.text }],
    });
    composerState.cancel();
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button onClick={handleSend}>Save</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Will trigger rule generation (
            <a
              onClick={() => props.setInfoDialogOpen(true)}
              className="text-blue-400 underline underline-offset-2 cursor-pointer"
            >
              whats this?
            </a>
            )
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MyEditComposer: FC = () => {
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const cancelEdit = useComposerCancel();
  const isLast = useMessage((m) => m.isLast);
  const wasLast = useRef(isLast);
  const send = useComposerSend();

  useEffect(() => {
    if (!wasLast.current || isLast) return;
    // if the message was the last one - cancel the edit whenever it stops being the last one
    cancelEdit?.();
  }, [cancelEdit, isLast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if ((e.metaKey || e.ctrlKey) && send) {
        // Only submit on `CMD + Enter` or `CTRL + Enter`
        e.preventDefault();
        send();
      }
    }
  };

  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-2xl flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input
        className="text-foreground flex h-8 w-full resize-none border-none bg-transparent p-4 pb-0 outline-none focus:ring-0"
        onKeyDown={handleKeyDown}
        // Don't submit on `Enter`, instead add a newline.
        submitOnEnter={false}
      />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <MyComposerSend setInfoDialogOpen={setInfoDialogOpen} />
      </div>
      <RuleInfoDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen} />
    </ComposerPrimitive.Root>
  );
};

interface MyAssistantMessageProps extends AssistantActionBarProps {}

const MyAssistantMessage: FC<MyAssistantMessageProps> = (
  props: MyAssistantMessageProps
) => {
  const edit = useActionBarEdit();
  const isDone = useMessage(
    (m) => (m.message as ThreadAssistantMessage).status?.type !== "running"
  );
  const isNew = useRef(!isDone);
  const isLast = useMessage((m) => m.isLast);
  const messageStore = useMessageStore();

  useEffect(() => {
    if (!isNew.current || !isLast || !isDone || !edit) return;
    const message = messageStore.getState().message;
    const lcMessage = getExternalStoreMessage<BaseMessage[]>(message)?.[0];
    if (!lcMessage?.response_metadata.contentGenerated) return;

    edit();
  }, [edit, isDone, isLast]);

  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-2xl grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <Avatar className="col-start-1 row-span-full row-start-1 mr-4">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-xl break-words leading-7">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>

      <MyAssistantActionBar onCopy={props.onCopy} />
    </MessagePrimitive.Root>
  );
};

interface AssistantActionBarProps {
  onCopy: () => void;
}

const MyAssistantActionBar: FC<AssistantActionBarProps> = (
  props: AssistantActionBarProps
) => {
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground data-[floating]:bg-background col-start-3 row-start-2 -ml-1 flex gap-1 data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="w-10 h-10">
          <PencilIcon size={24} />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
      <ActionBarPrimitive.Copy onClick={props.onCopy} asChild>
        <TooltipIconButton
          delayDuration={0}
          tooltip={
            <p>
              Will trigger rule generation (
              <a
                onClick={() => setInfoDialogOpen(true)}
                className="text-blue-400 underline underline-offset-2 cursor-pointer"
              >
                whats this?
              </a>
              )
            </p>
          }
          className="w-10 h-10"
        >
          <MessagePrimitive.If copied>
            <CheckIcon size={24} />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon size={24} />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <RuleInfoDialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen} />
    </ActionBarPrimitive.Root>
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
