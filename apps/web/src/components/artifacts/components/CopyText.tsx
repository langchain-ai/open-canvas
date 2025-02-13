import { motion } from "framer-motion";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { useToast } from "@/hooks/use-toast";
import { isArtifactCodeContent } from "@opencanvas/shared/utils/artifacts";
import { ArtifactCodeV3, ArtifactMarkdownV3 } from "@opencanvas/shared/types";
import { Copy } from "lucide-react";

interface CopyTextProps {
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
}

export function CopyText(props: CopyTextProps) {
  const { toast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipIconButton
        tooltip="Copy"
        variant="outline"
        className="transition-colors"
        delayDuration={400}
        onClick={() => {
          try {
            const text = isArtifactCodeContent(props.currentArtifactContent)
              ? props.currentArtifactContent.code
              : props.currentArtifactContent.fullMarkdown;
            navigator.clipboard.writeText(text).then(() => {
              toast({
                title: "Copied to clipboard",
                description: "The canvas content has been copied.",
                duration: 5000,
              });
            });
          } catch (_) {
            toast({
              title: "Copy error",
              description:
                "Failed to copy the canvas content. Please try again.",
              duration: 5000,
            });
          }
        }}
      >
        <Copy className="w-5 h-5 text-gray-600" />
      </TooltipIconButton>
    </motion.div>
  );
}
