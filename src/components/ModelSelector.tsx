"use client";

import { TbBoxModel } from "react-icons/tb";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_MODEL_NAMES,
  ANTHROPIC_MODEL_NAMES,
  FIREWORKS_MODEL_NAMES,
  OPENAI_MODEL_NAMES,
} from "@/constants";
import { Thread as ThreadType } from "@langchain/langgraph-sdk";

const allModels: ALL_MODEL_NAMES[] = [
  ...OPENAI_MODEL_NAMES,
  ...ANTHROPIC_MODEL_NAMES,
  ...FIREWORKS_MODEL_NAMES,
];

interface ModelSelectorProps {
  model: ALL_MODEL_NAMES;
  setModel: React.Dispatch<React.SetStateAction<ALL_MODEL_NAMES>>;
  createThread: (modelName: ALL_MODEL_NAMES) => Promise<ThreadType | undefined>;
}

export default function ModelSelector({
  model,
  setModel,
  createThread,
}: ModelSelectorProps) {
  const handleModelChange = async (newModel: ALL_MODEL_NAMES) => {
    // Create a new thread with the new model
    setModel(newModel);
    await createThread(newModel);
  };

  return (
    <Select value={model} onValueChange={handleModelChange}>
      <SelectTrigger className="min-w-[180px] w-fit bg-transparent shadow-none text-sm focus:outline-none cursor-pointer hover:bg-gray-100 rounded transition-colors border-none ">
        <SelectValue>
          <div className="flex items-center pr-2">
            <TbBoxModel className="size-4 mr-2" />
            {model}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allModels.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
