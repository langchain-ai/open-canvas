"use client";

import {
  ActionBarPrimitive,
  MessagePrimitive,
  useMessage,
} from "@assistant-ui/react";
import { useState, type FC } from "react";

import { MarkdownText } from "@/components/ui/assistant-ui/markdown-text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeedbackButton } from "./feedback";

interface AssistantMessageProps {
  runId: string | undefined;
}

export const AssistantMessage: FC<AssistantMessageProps> = ({ runId }) => {
  const isLast = useMessage().isLast;
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-2xl grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <Avatar className="col-start-1 row-span-full row-start-1 mr-4">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-xl break-words leading-7">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        {isLast && runId && (
          <MessagePrimitive.If lastOrHover assistant>
            <AssistantMessageBar runId={runId} />
          </MessagePrimitive.If>
        )}
      </div>
    </MessagePrimitive.Root>
  );
};

export const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
      <div className="bg-muted text-foreground col-start-2 row-start-1 max-w-xl break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
};

interface AssistantMessageBarProps {
  runId: string;
}

const AssistantMessageBar = ({ runId }: AssistantMessageBarProps) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
