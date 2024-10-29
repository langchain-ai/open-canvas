import { useToast } from "@/hooks/use-toast";
import { useFeedback } from "@/hooks/useFeedback";
import { Button } from "../ui/button";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";

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
