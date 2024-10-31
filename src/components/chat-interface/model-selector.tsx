"use client";

import { motion, AnimatePresence } from "framer-motion";
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
} from "@/constants";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, X } from "lucide-react";
import { TighterText } from "../ui/header";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";

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
  setModelName: Dispatch<SetStateAction<ALL_MODEL_NAMES>>;
  chatStarted: boolean;
}

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

export default function ModelSelector(props: ModelSelectorProps) {
  const { modelName, setModelName } = props;
  const [showAlert, setShowAlert] = useState(false);

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
        <SelectTrigger className="min-w-[180px] w-[210px] bg-transparent shadow-none text-sm focus:outline-none cursor-pointer hover:bg-gray-100 rounded transition-colors border-none text-gray-600">
          <SelectValue>
            <div className="flex items-center pr-2 truncate">
              <NextImage
                alt="Model icon"
                src={LLMIcon}
                width={14}
                height={14}
                className="mr-2"
              />
              <span className="truncate">{modelNameToLabel(modelName)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allAllowedModels.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              {model.label}
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
