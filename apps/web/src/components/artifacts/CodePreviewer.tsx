import { ArtifactCodeV3 } from "@opencanvas/shared/types";
import { LiveProvider, LivePreview, LiveError } from "react-live";
import { cn } from "@/lib/utils";
import { getPreviewCode } from "@/lib/get_preview_code";
import { motion } from "framer-motion";

export interface CodePreviewerProps {
  isExpanded: boolean;
  artifact: ArtifactCodeV3;
}

export function CodePreviewer({ isExpanded, artifact }: CodePreviewerProps) {
  const cleanedCode = getPreviewCode(artifact.code);

  return (
    <motion.div
      layout
      animate={{
        flex: isExpanded ? 0.5 : 0,
        opacity: isExpanded ? 1 : 0,
      }}
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "border-l-[1px] border-gray-200 h-screen overflow-hidden",
        isExpanded ? "px-5" : ""
      )}
    >
      <div className="w-full h-full">
        {isExpanded && (
          <LiveProvider noInline code={`${cleanedCode}`}>
            <LivePreview />
            <LiveError className="text-red-800 bg-red-100 rounded p-4" />
          </LiveProvider>
        )}
      </div>
    </motion.div>
  );
}
