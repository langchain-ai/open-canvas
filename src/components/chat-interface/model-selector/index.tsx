"use client";

import LLMIcon from "@/components/icons/svg/LLMIcon.svg";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ALL_MODEL_NAMES, ALL_MODELS } from "@/constants";
import { useCallback, useState } from "react";
import { AlertNewModelSelectorFeature } from "./alert-new-model-selector";
import { ModelConfigPanel } from "./model-config-pannel";
import { IsNewBadge } from "./new-badge";
import { cn } from "@/lib/utils";
import { CustomModelConfig } from "@/types";
import { CaretSortIcon, GearIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Check } from "lucide-react";
import NextImage from "next/image";

interface ModelSelectorProps {
  modelName: ALL_MODEL_NAMES;
  setModelName: (name: ALL_MODEL_NAMES) => void;
  chatStarted: boolean;
  modelConfig: CustomModelConfig;
  setModelConfig: (
    modelName: ALL_MODEL_NAMES,
    config: CustomModelConfig
  ) => void;
  modelConfigs: Record<string, CustomModelConfig>;
}

export default function ModelSelector({
  chatStarted,
  modelName,
  setModelConfig,
  setModelName,
  modelConfigs,
}: ModelSelectorProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [open, setOpen] = useState(false);
  const [openConfigModelId, setOpenConfigModelId] =
    useState<ALL_MODEL_NAMES | null>(null);

  const handleModelChange = useCallback(
    async (newModel: ALL_MODEL_NAMES) => {
      setModelName(newModel);
      setOpen(false);
    },
    [setModelName]
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
      model.name.includes("azure/") &&
      process.env.NEXT_PUBLIC_AZURE_ENABLED === "false"
    ) {
      return false;
    }
    if (
      model.name.includes("gemini-") &&
      process.env.NEXT_PUBLIC_GEMINI_ENABLED === "false"
    ) {
      return false;
    }
    if (
      model.name.includes("ollama-") &&
      process.env.NEXT_PUBLIC_OLLAMA_ENABLED === "false"
    ) {
      return false;
    }

    // By default, return true if the environment variable is not set or is set to true
    return true;
  });

  const selectedModelLabel =
    ALL_MODELS.find((m) => m.name === modelName)?.label || modelName;
  const isSelectedModelNew = ALL_MODELS.some(
    (m) => m.name === modelName && m.isNew
  );

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="min-w-[180px] w-[250px] bg-transparent shadow-none focus:outline-none cursor-pointer hover:bg-gray-100 rounded transition-colors border-none text-gray-600 h-9 px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
          asChild
        >
          <div className="flex items-center pr-2 truncate">
            <NextImage
              alt="Model icon"
              src={LLMIcon}
              width={14}
              height={14}
              className="mr-2"
            />
            <span className="flex flex-row items-center justify-start gap-2">
              {selectedModelLabel}
              {isSelectedModelNew && <IsNewBadge />}
            </span>
            <CaretSortIcon className="size-4 opacity-50 ml-auto" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[180px] w-[280px] p-0 shadow-md rounded-md">
          <Command>
            <CommandList>
              {allAllowedModels.map((model) => {
                const config =
                  modelConfigs[model.name] ||
                  modelConfigs[model.name.replace("azure/", "")];

                return (
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

                      {openConfigModelId === model.name ? (
                        <ModelConfigPanel
                          model={model}
                          modelConfig={config}
                          isOpen={true}
                          onOpenChange={(open) =>
                            setOpenConfigModelId(open ? model.name : null)
                          }
                          onClick={(e) => e.stopPropagation()}
                          setModelConfig={setModelConfig}
                        />
                      ) : (
                        <button
                          className="ml-auto flex-shrink-0 flex size-6 items-center justify-center focus:outline-none focus:ring-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenConfigModelId(model.name);
                          }}
                        >
                          <GearIcon className="size-4" />
                        </button>
                      )}
                    </CommandItem>
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="absolute top-full -left-10 pt-2 w-max min-w-full">
        <AlertNewModelSelectorFeature
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          chatStarted={chatStarted}
        />
      </div>
    </div>
  );
}
