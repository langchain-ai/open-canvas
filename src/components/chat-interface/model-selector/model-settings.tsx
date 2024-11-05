import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomModelConfig, ModelConfigurationParams } from "@/types";

import { cn } from "@/lib/utils";
import { GearIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";

interface SettingSectionProps {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number[]) => void;
}

const SettingSection = ({
  title,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: SettingSectionProps) => (
  <div className="space-y-2">
    <h4 className="font-medium leading-none">{title}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={onChange}
    />
    <div className="text-right text-sm">{value}</div>
  </div>
);

interface ModelSettingsProps {
  model: ModelConfigurationParams;
  className?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClick: (e: any) => any;
  modelConfig: CustomModelConfig;
  setModelConfig: (
    config: CustomModelConfig | ((prev: CustomModelConfig) => CustomModelConfig)
  ) => void;
}

export function ModelSettings({
  model,
  className,
  isOpen,
  onOpenChange,
  onClick,
  modelConfig,
  setModelConfig,
}: ModelSettingsProps) {
  const handleTemperatureChange = useCallback(
    (value: number[]) => {
      setModelConfig((prev) => ({
        ...prev,
        temperatureRange: {
          ...prev.temperatureRange,
          current: value[0],
        },
      }));
    },
    [setModelConfig]
  );

  const handleMaxTokensChange = useCallback(
    (value: number[]) => {
      setModelConfig((prev) => ({
        ...prev,
        maxTokens: {
          ...prev.maxTokens,
          current: value[0],
        },
      }));
    },
    [setModelConfig]
  );

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger onClick={onClick} asChild>
        <button className="flex-shrink-0 size-6">
          <GearIcon className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className={cn("w-80 p-6 rounded-xl shadow-lg", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-4">
          <SettingSection
            title="Temperature"
            description="Controls creativity - lower for focused outputs, higher for more variety and imagination."
            value={modelConfig.temperatureRange.current}
            min={model.config.temperatureRange.min}
            max={model.config.temperatureRange.max}
            step={0.1}
            onChange={handleTemperatureChange}
          />
          <SettingSection
            title="Max Tokens"
            description="Set how long the AI's response can be - more tokens mean longer, more detailed responses."
            value={modelConfig.maxTokens.current}
            min={model.config.maxTokens.min}
            max={model.config.maxTokens.max}
            step={1}
            onChange={handleMaxTokensChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
