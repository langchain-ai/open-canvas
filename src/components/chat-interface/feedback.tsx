import { useToast } from "@/hooks/use-toast";
import { FeedbackResponse } from "@/hooks/useFeedback";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";
import { Dispatch, FC, SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";

interface FeedbackButtonProps {
  runId: string;
  setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
  sendFeedback: (
    runId: string,
    feedbackKey: string,
    score: number,
    comment?: string
  ) => Promise<FeedbackResponse | undefined>;
  feedbackValue: number;
  icon: "thumbs-up" | "thumbs-down";
  isLoading: boolean;
}

export const FeedbackButton: FC<FeedbackButtonProps> = ({
  runId,
  setFeedbackSubmitted,
  sendFeedback,
  isLoading,
  feedbackValue,
  icon,
}) => {
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

  const tooltip = `Give ${icon === "thumbs-up" ? "positive" : "negative"} feedback on this run`;

  return (
    <TooltipIconButton
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label={tooltip}
      tooltip={tooltip}
      disabled={isLoading}
    >
      {icon === "thumbs-up" ? (
        <ThumbsUpIcon className={cn("size-4", isLoading && "text-gray-300")} />
      ) : (
        <ThumbsDownIcon
          className={cn("size-4", isLoading && "text-gray-300")}
        />
      )}
    </TooltipIconButton>
  );
};
