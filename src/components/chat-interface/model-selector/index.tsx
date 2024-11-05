"use client";

import LLMIcon from "@/components/icons/svg/LLMIcon.svg";
import NextImage from "next/image";
import {
  ALL_MODEL_NAMES,
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
  FIREWORKS_MODELS,
  GEMINI_MODELS,
} from "@/constants";
import { useState } from "react";
import { AlertNewModelSelectorFeature } from "./alert-new-model-selector";
import { IsNewBadge } from "./new-badge";
import { CustomModelConfig } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { SelectSelector } from "./select-selector";

const allModels = [
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
  ...FIREWORKS_MODELS,
  ...GEMINI_MODELS,
];

const modelNameToLabel = (modelName: ALL_MODEL_NAMES) => {
  const model = allModels.find((m) => m.name === modelName);
  return model?.label ?? modelName;
};

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

  const isSelectedModelNew = !!allModels.find(
    (model) => model.name === props.modelName && model.isNew
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
              {modelNameToLabel(props.modelName)}
              {isSelectedModelNew && <IsNewBadge />}
            </span>
            <CaretSortIcon className="size-4 opacity-50 ml-auto" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-[180px] w-[280px] p-0">
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
