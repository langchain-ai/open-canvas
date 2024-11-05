import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { ModelSettings } from "./model-settings";
import { Check } from "lucide-react";
import { ALL_MODELS } from "./constants";
import { useCallback, useState } from "react";
import { ALL_MODEL_NAMES } from "@/constants";
import { CustomModelConfig } from "@/types";
import { cn } from "@/lib/utils";
import { IsNewBadge } from "./new-badge";

interface SelectSelectorProps {
  modelName: ALL_MODEL_NAMES;
  setModelName: (name: ALL_MODEL_NAMES) => void;
  chatStarted: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  modelConfig: CustomModelConfig;
  setModelConfig: (
    config: CustomModelConfig | ((prev: CustomModelConfig) => CustomModelConfig)
  ) => void;
}

export function SelectSelector(props: SelectSelectorProps) {
  const { modelName, setModelName, modelConfig, setModelConfig, setOpen } =
    props;
  const [activeSettings, setActiveSettings] = useState<string | null>(null);

  const handleModelChange = useCallback(
    async (newModel: ALL_MODEL_NAMES) => {
      setModelName(newModel);

      const selectedModel = ALL_MODELS.find((model) => model.name === newModel);
      if (selectedModel) {
        setModelConfig(selectedModel.config);
      }
      setOpen(false);
    },
    [setModelName, setOpen, setModelConfig]
  );

  const allAllowedModels = ALL_MODELS.filter((model) => {
    if (
      model.name.includes("fireworks/") &&
      process.env.NEXT_PUBLIC_FIREWORKS_ENABLED === "false"
    ) {
      return false;
    }
    if (
      model.name.includes("claude-") &&
      process.env.NEXT_PUBLIC_ANTHROPIC_ENABLED === "false"
    ) {
      return false;
    }
    if (
      model.name.includes("gpt-") &&
      process.env.NEXT_PUBLIC_OPENAI_ENABLED === "false"
    ) {
      return false;
    }
    if (
      model.name.includes("gemini-") &&
      process.env.NEXT_PUBLIC_GEMINI_ENABLED === "false"
    ) {
      return false;
    }

    // By default, return true if the environment variable is not set or is set to true
    return true;
  });

  return (
    <Command>
      <CommandList>
        {allAllowedModels.map((model) => (
          <CommandGroup key={model.name} className="w-full">
            <CommandItem
              value={model.name}
              onSelect={handleModelChange}
              className="flex items-center"
            >
              <Check
                className={cn(
                  "mr-1 size-4",
                  modelName === model.name ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="flex flex-row w-full items-center justify-start gap-2">
                {model.label}
                {model.isNew && <IsNewBadge />}
              </span>
              <ModelSettings
                className="ml-auto"
                model={model}
                isOpen={activeSettings === model.name}
                onOpenChange={(open) => {
                  setActiveSettings(open ? model.name : null);
                }}
                onClick={(e) => e.stopPropagation()} // Prevent onSelect from being triggered
                modelConfig={modelConfig}
                setModelConfig={setModelConfig}
              />
            </CommandItem>
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}