import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dispatch, MouseEventHandler, SetStateAction } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { cn } from "@/lib/utils";
import { getIcon } from "./utils";
import { EditDeleteDropdown } from "./edit-delete-dropdown";

interface AssistantItemProps {
  assistant: Assistant;
  allDisabled: boolean;
  selectedAssistantId: string | undefined;
  setAllDisabled: Dispatch<SetStateAction<boolean>>;
  onClick: MouseEventHandler<HTMLDivElement>;
  setEditModalOpen: Dispatch<SetStateAction<boolean>>;
  deleteAssistant: (assistantId: string) => Promise<boolean>;
  setAssistantDropdownOpen: Dispatch<SetStateAction<boolean>>;
  setEditingAssistant: Dispatch<SetStateAction<Assistant | undefined>>;
}

export function AssistantItem({
  allDisabled,
  assistant,
  selectedAssistantId,
  setAllDisabled,
  onClick,
  setEditModalOpen,
  deleteAssistant,
  setAssistantDropdownOpen,
  setEditingAssistant,
}: AssistantItemProps) {
  const isDefault = assistant.metadata?.is_default as boolean | undefined;
  const isSelected = assistant.assistant_id === selectedAssistantId;
  const metadata = assistant.metadata as Record<string, any>;

  return (
    <div className="flex items-center justify-center w-full gap-1">
      <DropdownMenuItem
        onClick={onClick}
        disabled={allDisabled}
        className={cn(
          "flex items-center justify-start gap-2 w-full",
          isSelected && "bg-gray-50"
        )}
      >
        <span
          style={{ color: metadata?.iconData?.iconColor || "#4b5563" }}
          className="flex items-center justify-start w-4 h-4"
        >
          {getIcon(metadata?.iconData?.iconName as string | undefined)}
        </span>
        {assistant.name}
        {isDefault && (
          <span className="text-xs text-gray-500 ml-auto">{"(default)"}</span>
        )}
        {isSelected && <span className="ml-auto">•</span>}
      </DropdownMenuItem>
      <EditDeleteDropdown
        allowDelete={!isDefault}
        setDisabled={setAllDisabled}
        disabled={allDisabled}
        setEditingAssistant={setEditingAssistant}
        setEditModalOpen={setEditModalOpen}
        deleteAssistant={deleteAssistant}
        setAssistantDropdownOpen={setAssistantDropdownOpen}
        selectedAssistant={assistant}
      />
    </div>
  );
}
