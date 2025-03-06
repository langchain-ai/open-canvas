"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ActionBarPrimitive,
  getExternalStoreMessage,
  MessagePrimitive,
  MessageState,
  useMessage,
} from "@assistant-ui/react";
import React, { Dispatch, SetStateAction, type FC } from "react";

import { MarkdownText } from "@/components/ui/assistant-ui/markdown-text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FeedbackButton } from "./feedback";
import { TighterText } from "../ui/header";
import { useFeedback } from "@/hooks/useFeedback";
import { ContextDocumentsUI } from "../tool-hooks/AttachmentsToolUI";
import { HumanMessage } from "@langchain/core/messages";
import { OC_HIDE_FROM_UI_KEY } from "@opencanvas/shared/constants";
import { Button } from "../ui/button";
import { WEB_SEARCH_RESULTS_QUERY_PARAM } from "@/constants";
import { Globe } from "lucide-react";
import { useQueryState } from "nuqs";

interface AssistantMessageProps {
  runId: string | undefined;
  feedbackSubmitted: boolean;
  setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
}

const ThinkingAssistantMessageComponent = ({
  message,
}: {
  message: MessageState;
}): React.ReactElement => {
  const { id, content } = message;
  let contentText = "";
  if (typeof content === "string") {
    contentText = content;
  } else {
    const firstItem = content?.[0];
    if (firstItem?.type === "text") {
      contentText = firstItem.text;
    }
  }

  if (contentText === "") {
    return <></>;
  }

  return (
    <Accordion
      defaultValue={`accordion-${id}`}
      type="single"
      collapsible
      className="w-full"
    >
      <AccordionItem value={`accordion-${id}`}>
        <AccordionTrigger>Thoughts</AccordionTrigger>
        <AccordionContent>{contentText}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ThinkingAssistantMessage = React.memo(ThinkingAssistantMessageComponent);

const WebSearchMessageComponent = ({ message }: { message: MessageState }) => {
  const [_, setShowWebResultsId] = useQueryState(
    WEB_SEARCH_RESULTS_QUERY_PARAM
  );

  const handleShowWebSearchResults = () => {
    if (!message.id) {
      return;
    }

    setShowWebResultsId(message.id);
  };

  return (
    <div className="flex mx-8">
      <Button
        onClick={handleShowWebSearchResults}
        variant="secondary"
        className="bg-blue-50 hover:bg-blue-100 transition-all ease-in-out duration-200 w-full"
      >
        <Globe className="size-4 mr-2" />
        Web Search Results
      </Button>
    </div>
  );
};

const WebSearchMessage = React.memo(WebSearchMessageComponent);

export const AssistantMessage: FC<AssistantMessageProps> = ({
  runId,
  feedbackSubmitted,
  setFeedbackSubmitted,
}) => {
  const message = useMessage();
  const { isLast } = message;
  const isThinkingMessage = message.id.startsWith("thinking-");
  const isWebSearchMessage = message.id.startsWith("web-search-results-");

  if (isThinkingMessage) {
    return <ThinkingAssistantMessage message={message} />;
  }

  if (isWebSearchMessage) {
    return <WebSearchMessage message={message} />;
  }

  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-2xl grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <Avatar className="col-start-1 row-span-full row-start-1 mr-4">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-xl break-words leading-7">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        {isLast && runId && (
          <MessagePrimitive.If lastOrHover assistant>
            <AssistantMessageBar
              feedbackSubmitted={feedbackSubmitted}
              setFeedbackSubmitted={setFeedbackSubmitted}
              runId={runId}
            />
          </MessagePrimitive.If>
        )}
      </div>
    </MessagePrimitive.Root>
  );
};

export const UserMessage: FC = () => {
  const msg = useMessage(getExternalStoreMessage<HumanMessage>);
  const humanMessage = Array.isArray(msg) ? msg[0] : msg;

  if (humanMessage?.additional_kwargs?.[OC_HIDE_FROM_UI_KEY]) return null;

  return (
    <MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
      <ContextDocumentsUI
        message={humanMessage}
        className="col-start-2 row-start-1"
      />
      <div className="bg-muted text-foreground col-start-2 row-start-2 max-w-xl break-words rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
};

interface AssistantMessageBarProps {
  runId: string;
  feedbackSubmitted: boolean;
  setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
}

const AssistantMessageBarComponent = ({
  runId,
  feedbackSubmitted,
  setFeedbackSubmitted,
}: AssistantMessageBarProps) => {
  const { isLoading, sendFeedback } = useFeedback();
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex items-center mt-2"
    >
      {feedbackSubmitted ? (
        <TighterText className="text-gray-500 text-sm">
          Feedback received! Thank you!
        </TighterText>
      ) : (
        <>
          <ActionBarPrimitive.FeedbackPositive asChild>
            <FeedbackButton
              isLoading={isLoading}
              sendFeedback={sendFeedback}
              setFeedbackSubmitted={setFeedbackSubmitted}
              runId={runId}
              feedbackValue={1.0}
              icon="thumbs-up"
            />
          </ActionBarPrimitive.FeedbackPositive>
          <ActionBarPrimitive.FeedbackNegative asChild>
            <FeedbackButton
              isLoading={isLoading}
              sendFeedback={sendFeedback}
              setFeedbackSubmitted={setFeedbackSubmitted}
              runId={runId}
              feedbackValue={0.0}
              icon="thumbs-down"
            />
          </ActionBarPrimitive.FeedbackNegative>
        </>
      )}
    </ActionBarPrimitive.Root>
  );
};

const AssistantMessageBar = React.memo(AssistantMessageBarComponent);
