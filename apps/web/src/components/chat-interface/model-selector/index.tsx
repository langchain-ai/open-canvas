"use client";

import LLMIcon from "@/components/icons/svg/LLMIcon.svg";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ALL_MODEL_NAMES,
  ALL_MODELS,
  LANGCHAIN_USER_ONLY_MODELS,
} from "@opencanvas/shared/models";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ModelConfigPanel } from "./model-config-pannel";
import { IsNewBadge } from "./new-badge";
import { cn } from "@/lib/utils";
import {
  CustomModelConfig,
  ModelConfigurationParams,
} from "@opencanvas/shared/types";
import { CaretSortIcon, GearIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Check } from "lucide-react";
import NextImage from "next/image";
import { useUserContext } from "@/contexts/UserContext";

interface ModelSelectorProps {
  modelName: ALL_MODEL_NAMES;
  setModelName: (name: ALL_MODEL_NAMES) => void;
  modelConfig: CustomModelConfig;
  setModelConfig: (
    modelName: ALL_MODEL_NAMES,
    config: CustomModelConfig
  ) => void;
  modelConfigs: Record<string, CustomModelConfig>;
}

interface CommandModelItemProps {
  model: ModelConfigurationParams;
  handleModelChange: (newModel: ALL_MODEL_NAMES) => Promise<void>;
  selectedModelName: ALL_MODEL_NAMES;
  openConfigModelId: string | undefined;
  config: CustomModelConfig;
  setOpenConfigModelId: Dispatch<SetStateAction<string | undefined>>;
  setModelConfig: (
    modelName: ALL_MODEL_NAMES,
    config: CustomModelConfig
  ) => void;
}

function CommandModelItem({
  model,
  handleModelChange,
  selectedModelName,
  openConfigModelId,
  config,
  setOpenConfigModelId,
  setModelConfig,
}: CommandModelItemProps) {
  return (
    <CommandItem
      value={model.name}
      onSelect={handleModelChange}
      className="flex items-center"
    >
      <Check
        className={cn(
          "mr-1 size-4",
          selectedModelName === model.name ? "opacity-100" : "opacity-0"
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
            setOpenConfigModelId(open ? model.name : undefined)
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
  );
}

export default function ModelSelector({
  modelName,
  setModelConfig,
  setModelName,
  modelConfigs,
}: ModelSelectorProps) {
  const { user } = useUserContext();
  const [isLangChainUser, setIsLangChainUser] = useState(false);
  const [open, setOpen] = useState(false);
  const [openConfigModelId, setOpenConfigModelId] = useState<ALL_MODEL_NAMES>();

  useEffect(() => {
    if (!user) return;
    setIsLangChainUser(user?.email?.endsWith("@langchain.dev") || false);
  }, [user]);

  const handleModelChange = useCallback(
    async (newModel: ALL_MODEL_NAMES) => {
      setModelName(newModel);
      setOpen(false);
    },
    [setModelName]
  );

  const allAllowedModels = ALL_MODELS.filter((model) => {
    if (
      !isLangChainUser &&
      LANGCHAIN_USER_ONLY_MODELS.some((m) => m === model.name)
    ) {
      return false;
    }

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

    if (
      model.name.includes("groq/") &&
      process.env.NEXT_PUBLIC_GROQ_ENABLED === "false"
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

  const azureModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "azure_openai"
  );
  const openaiModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "openai"
  );
  const ollamaModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "ollama"
  );
  const anthropicModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "anthropic"
  );
  const genAiModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "google-genai"
  );
  const fireworksModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "fireworks"
  );
  const groqModelGroup = allAllowedModels.filter(
    (m) => m.config.provider === "groq"
  );

  return (
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
            {openaiModelGroup.length > 0 && (
              <CommandGroup heading="OpenAI" className="w-full">
                {openaiModelGroup.map((model) => {
                  const config = modelConfigs[model.name];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}

            {azureModelGroup.length > 0 && (
              <CommandGroup heading="Azure OpenAI" className="w-full">
                {azureModelGroup.map((model) => {
                  const config = modelConfigs[model.name.replace("azure/", "")];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}

            {anthropicModelGroup.length > 0 && (
              <CommandGroup heading="Anthropic" className="w-full">
                {anthropicModelGroup.map((model) => {
                  const config = modelConfigs[model.name];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}

            {genAiModelGroup.length > 0 && (
              <CommandGroup heading="Google GenAI" className="w-full">
                {genAiModelGroup.map((model) => {
                  const config = modelConfigs[model.name];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}

            {groqModelGroup.length > 0 && (
              <CommandGroup heading="Groq" className="w-full">
                {groqModelGroup.map((model) => {
                  const config = modelConfigs[model.name];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}

            {fireworksModelGroup.length > 0 && (
              <CommandGroup heading="Fireworks" className="w-full">
                {fireworksModelGroup.map((model) => {
                  const config = modelConfigs[model.name];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}

            {ollamaModelGroup.length > 0 && (
              <CommandGroup heading="Ollama" className="w-full">
                {ollamaModelGroup.map((model) => {
                  const config = modelConfigs[model.name];
                  return (
                    <CommandModelItem
                      key={model.name}
                      model={model}
                      handleModelChange={handleModelChange}
                      config={config}
                      selectedModelName={modelName}
                      openConfigModelId={openConfigModelId}
                      setOpenConfigModelId={setOpenConfigModelId}
                      setModelConfig={setModelConfig}
                    />
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
