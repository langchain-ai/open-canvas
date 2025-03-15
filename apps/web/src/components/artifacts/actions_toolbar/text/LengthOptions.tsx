import { cn } from "@/lib/utils";
import { useState } from "react";
import { ArtifactLengthOptions } from "@opencanvas/shared/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { GraphInput } from "@opencanvas/shared/types";
import { motion, AnimatePresence } from "framer-motion";

export interface LengthOptionsProps {
  streamMessage: (params: GraphInput) => Promise<void>;
  handleClose: () => void;
}

const lengthOptions = [
  { value: 1, label: "Shortest" },
  { value: 2, label: "Shorter" },
  { value: 3, label: "Current length" },
  { value: 4, label: "Long" },
  { value: 5, label: "Longest" },
];

export function LengthOptions(props: LengthOptionsProps) {
  const { streamMessage } = props;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState([3]);

  const handleSubmit = async (artifactLength: ArtifactLengthOptions) => {
    props.handleClose();
    await streamMessage({
      artifactLength,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="h-[200px] flex items-center justify-center px-4"
    >
      <TooltipProvider>
        <Tooltip open={open}  >
          <TooltipTrigger asChild>
            <div className="relative">
              <Slider
                defaultValue={[3]}
                max={5}
                min={1}
                step={1}
                value={value}
                onValueChange={(newValue) => {
                  setValue(newValue);
                  setOpen(true);
                }}
                onValueCommit={async (v) => {
                  setOpen(false);
                  switch (v[0]) {
                    case 1:
                      await handleSubmit("shortest");
                      break;
                    case 2:
                      await handleSubmit("short");
                      break;
                    case 3:
                      // Same length, do nothing.
                      break;
                    case 4:
                      await handleSubmit("long");
                      break;
                    case 5:
                      await handleSubmit("longest");
                      break;
                  }
                }}
                orientation="vertical"
                className={cn(
                  "h-[180px]",
                  "[&_.relative]:w-2",
                  "[&_.relative]:bg-gray-200",
                  "[&_.relative]:rounded-full",
                  "[&_.absolute]:w-2",
                  "[&_.absolute]:bg-black",
                  "[&_.absolute]:rounded-full",
                  "[&_.absolute]:hover:bg-black/90",
                  "[&_.absolute]:focus:outline-none",
                  "[&_.absolute]:focus:ring-2",
                  "[&_.absolute]:focus:ring-black/20",
                  "[&_.absolute]:focus:ring-offset-2",
                  "[&_.absolute]:focus:ring-offset-white"
                )}
              />
              <AnimatePresence>
                <motion.div
                  key={value[0]}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                  className="absolute -left-32 bottom-full -translate-y-1/2 bg-black text-white px-2 py-1 rounded text-sm"
                >
                  {lengthOptions.find((option) => option.value === value[0])?.label}
                </motion.div>
              </AnimatePresence>
            </div>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
