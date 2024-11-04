"use client";

import LLMIcon from "@/components/icons/svg/LLMIcon.svg";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ALL_MODEL_NAMES,
  ANTHROPIC_MODELS,
  FIREWORKS_MODELS,
  GEMINI_MODELS,
  LS_HAS_SEEN_MODEL_DROPDOWN_ALERT,
  OPENAI_MODELS,
} from "@/constants";
import { CustomModelConfig, ModelConfigurationParams } from "@/types";

import { cn } from "@/lib/utils";
import { CaretSortIcon, GearIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, X } from "lucide-react";
import NextImage from "next/image";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { TighterText } from "../ui/header";
import { Slider } from "../ui/slider";

const allModels = [
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
  ...FIREWORKS_MODELS,
  ...GEMINI_MODELS,
];

const modelLabelMap = new Map(
  allModels.map((model) => [model.name, model.label])
);

const modelNameToLabel = (modelName: ALL_MODEL_NAMES) => {
  return modelLabelMap.get(modelName) ?? modelName;
};

const AlertNewModelSelectorFeature = ({
  chatStarted,
  showAlert,
  setShowAlert,
}: {
  chatStarted: boolean;
  showAlert: boolean;
  setShowAlert: Dispatch<SetStateAction<boolean>>;
}) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenAlert = localStorage.getItem(LS_HAS_SEEN_MODEL_DROPDOWN_ALERT);
    if (!hasSeenAlert) {
      setShowAlert(true);
    }
  }, []);

  const handleCloseAlert = () => {
    setShowAlert(false);
    // Wait for animation to complete before setting localStorage
    setTimeout(() => {
      localStorage.setItem(LS_HAS_SEEN_MODEL_DROPDOWN_ALERT, "true");
    }, 300);
  };

  if (!showAlert && !chatStarted) {
    return <AnimatePresence />; // Keep AnimatePresence mounted to enable fading out
  }

  return (
    <AnimatePresence mode="wait">
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative p-[0px] rounded-lg bg-gradient-to-r from-pink-500/50 via-purple-500/50 to-pink-500/50 animate-gradient-xy shadow-[0_0_25px_rgba(236,72,153,0.3)] before:absolute before:inset-0 before:rounded-lg before:p-[12px] before:bg-gradient-to-r before:from-pink-500/20 before:via-purple-500/20 before:to-pink-500/20 before:blur-xl before:-z-10 before:animate-gradient-xy-enhanced">
            <Alert className="max-w-xl bg-white rounded-lg hover:bg-gray-50 transition-colors duration-300 ease-in-out">
              <AlertTitle className="flex justify-between items-center">
                <div className="flex items-center justify-start gap-1">
                  <NextImage
                    alt="Model icon"
                    src={LLMIcon}
                    width={16}
                    height={16}
                  />
                  <TighterText>Customize your LLM model!</TighterText>
                </div>
                <TooltipIconButton
                  tooltip="Close alert"
                  variant="ghost"
                  delayDuration={400}
                  onClick={handleCloseAlert}
                  size="sm"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </TooltipIconButton>
              </AlertTitle>
              <AlertDescription className="inline-flex items-center gap-1 flex-wrap mt-2">
                <p>
                  Open Canvas now supports customizing your LLM model! Click the
                  dropdown above to pick a model from{" "}
                  <a
                    href="https://fireworks.ai/"
                    target="_blank"
                    className="inline-flex items-baseline gap-[2px]"
                  >
                    <ExternalLink size={12} />
                    Fireworks AI
                  </a>
                  ,{" "}
                  <a
                    href="https://anthropic.com/"
                    target="_blank"
                    className="inline-flex items-baseline gap-[2px]"
                  >
                    <ExternalLink size={12} />
                    Anthropic
                  </a>
                  , or{" "}
                  <a
                    href="https://openai.com/"
                    target="_blank"
                    className="inline-flex items-baseline gap-[2px]"
                  >
                    <ExternalLink size={12} />
                    OpenAI
                  </a>
                  .
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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

const ModelSettings = ({
  model,
  className,
  isOpen,
  onOpenChange,
  onClick,
  modelConfig,
  setModelConfig,
}: ModelSettingsProps) => {
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
};
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
      setOpen(false);
    },
    [setModelName, setOpen]
  );

  const allAllowedModels = allModels.filter((model) => {
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
              <span className="flex-1">{model.label}</span>
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

interface ModelSelectorProps {
  modelName: ALL_MODEL_NAMES;
  setModelName: (name: ALL_MODEL_NAMES) => void;
  chatStarted: boolean;
  modelConfig: CustomModelConfig;
  setModelConfig: (
    config: CustomModelConfig | ((prev: CustomModelConfig) => CustomModelConfig)
  ) => void;
}

export default function ModelSelector(props: ModelSelectorProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [open, setOpen] = useState(false);

  console.log("ModelSelector modelConfig: ", props.modelConfig);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="min-w-[180px] w-[210px] bg-transparent shadow-none focus:outline-none cursor-pointer hover:bg-gray-100 rounded transition-colors border-none text-gray-600 h-9 px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
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
            <span className="truncate">
              {modelNameToLabel(props.modelName)}
            </span>
            <CaretSortIcon className="size-4 opacity-50 ml-auto" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[180px] w-[240px] p-0">
          <SelectSelector
            chatStarted={props.chatStarted}
            modelName={props.modelName}
            setModelName={props.setModelName}
            open={open}
            setOpen={setOpen}
            modelConfig={props.modelConfig}
            setModelConfig={props.setModelConfig}
          />
        </PopoverContent>
      </Popover>
      <div className="absolute top-full -left-10 pt-2 w-max min-w-full">
        <AlertNewModelSelectorFeature
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          chatStarted={props.chatStarted}
        />
      </div>
    </div>
  );
}
