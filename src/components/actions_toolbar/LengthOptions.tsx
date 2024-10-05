import { cn } from "@/lib/utils";
import { Slider } from "../ui/slider";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const lengthOptions = [
  { value: 1, label: "Shortest" },
  { value: 2, label: "Shorter" },
  { value: 3, label: "Current length" },
  { value: 4, label: "Long" },
  { value: 5, label: "Longest" },
];

export function LengthOptions() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState([3]);

  return (
    <div className="h-[200px] flex items-center justify-center px-4">
      <TooltipProvider>
        <Tooltip open={open}>
          <TooltipTrigger asChild>
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
              onValueCommit={(v) => {
                // TODO: event handler goes here
                console.log("Released", v);
                setOpen(false);
              }}
              orientation="vertical"
              color="black"
              className={cn("h-[180px] w-[26px]")}
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            {lengthOptions.find((option) => option.value === value[0])?.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
