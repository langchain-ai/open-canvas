"use client";

import { TbBoxModel } from "react-icons/tb";

import { AllModelNames, anthropicModels, openAIModels } from "@/agent/lib";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Thread } from "@langchain/langgraph-sdk";

const allModels: AllModelNames[] = [...openAIModels, ...anthropicModels];

interface ModelSelectorProps {
  model: AllModelNames;
  setModel: React.Dispatch<React.SetStateAction<AllModelNames>>;
  createThread: (modelName: AllModelNames) => Promise<Thread>;
}

export default function ModelSelector({
  model,
  setModel,
  createThread,
}: ModelSelectorProps) {
  const handleModelChange = async (newModel: AllModelNames) => {
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
