"use client";

import LLMIcon from "@/components/icons/svg/LLMIcon.svg";
import NextImage from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_MODEL_NAMES,
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
  FIREWORKS_MODELS,
  GEMINI_MODELS,
  LS_HAS_SEEN_MODEL_DROPDOWN_ALERT,
  AZURE_MODELS,
} from "@/constants";
import { Dispatch, SetStateAction, useState } from "react";
import { AlertNewModelSelectorFeature } from "./alert-new-model-selector";
import { IsNewBadge } from "./new-badge";

const allModels = [
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
  ...FIREWORKS_MODELS,
  ...GEMINI_MODELS,
  ...AZURE_MODELS,
];

const modelNameToLabel = (modelName: ALL_MODEL_NAMES) => {
  const model = allModels.find((m) => m.name === modelName);
  return model?.label ?? modelName;
};

interface ModelSelectorProps {
  modelName: ALL_MODEL_NAMES;
  setModelName: Dispatch<SetStateAction<ALL_MODEL_NAMES>>;
  chatStarted: boolean;
}

export default function ModelSelector(props: ModelSelectorProps) {
  const { modelName, setModelName } = props;
  const [showAlert, setShowAlert] = useState(false);

  const isSelectedModelNew = !!allModels.find(
    (model) => model.name === modelName && model.isNew
  );

  const handleModelChange = async (newModel: ALL_MODEL_NAMES) => {
    // Create a new thread with the new model
    setModelName(newModel);
    if (showAlert) {
      // Ensure the model is closed if the user selects a model
      setShowAlert(false);
      localStorage.setItem(LS_HAS_SEEN_MODEL_DROPDOWN_ALERT, "true");
    }
  };
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

    // By default, return true if the environment variable is not set or is set to true
    return true;
  });

  return (
    <div className="relative">
      <Select value={modelName} onValueChange={handleModelChange}>
        <SelectTrigger className="min-w-[180px] w-[250px] bg-transparent shadow-none text-sm focus:outline-none cursor-pointer hover:bg-gray-100 rounded transition-colors border-none text-gray-600">
          <SelectValue>
            <div className="flex items-center pr-2 truncate">
              <NextImage
                alt="Model icon"
                src={LLMIcon}
                width={14}
                height={14}
                className="mr-2"
              />
              <span className="flex flex-row items-center justify-start gap-2">
                {modelNameToLabel(modelName)}
                {isSelectedModelNew && <IsNewBadge />}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allAllowedModels.map((model) => (
            <SelectItem key={model.name} value={model.name} className="mr-2">
              <span className="flex flex-row w-full items-center justify-start gap-2">
                {model.label}
                {model.isNew && <IsNewBadge />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
