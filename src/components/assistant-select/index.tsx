import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MouseEventHandler, useState } from "react";
import * as Icons from "lucide-react";
import React from "react";
import { TighterText } from "../ui/header";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { useGraphContext } from "@/contexts/GraphContext";
import { Assistant } from "@langchain/langgraph-sdk";
import { CreateEditAssistantDialog } from "./create-edit-assistant-dialog";

const getIcon = (iconName?: string) => {
  if (iconName && Icons[iconName as keyof typeof Icons]) {
    return React.createElement(
      Icons[iconName as keyof typeof Icons] as React.ElementType
    );
  }
  return React.createElement(Icons.User);
};

function AssistantItem({
  assistant,
  selectedAssistantId,
  onClick,
}: {
  assistant: Assistant;
  selectedAssistantId: string | undefined;
  onClick: MouseEventHandler<HTMLDivElement>;
}) {
  const isDefault = assistant.metadata?.is_default as boolean | undefined;
  const isSelected = assistant.assistant_id === selectedAssistantId;

  return (
    <DropdownMenuItem
      onClick={onClick}
      className="flex items-center justify-start gap-1"
    >
      {isSelected && <>•</>}
      {getIcon(assistant.metadata?.iconName as string | undefined)}
      {assistant.name}
      {isDefault && (
        <span className="text-xs text-gray-500">{"(default)"}</span>
      )}
    </DropdownMenuItem>
  );
}

function AssistantSelectComponent() {
  const [open, setOpen] = useState(false);
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const {
    assistantsData: {
      assistants,
      selectedAssistant,
      isLoadingAllAssistants,
      setSelectedAssistant,
      createCustomAssistant,
      editCustomAssistant,
      deleteAssistant,
    },
  } = useGraphContext();

  const handleNewAssistantClick = (event: Event) => {
    event.preventDefault();
    setCreateEditDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="text-gray-600" asChild>
          <TooltipIconButton
            tooltip="Change assistant"
            variant="ghost"
            delayDuration={200}
            className="w-8 h-8 transition-colors ease-in-out duration-200"
          >
            {getIcon(
              selectedAssistant?.metadata?.iconName as string | undefined
            )}
          </TooltipIconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[600px] max-w-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ml-4">
          <DropdownMenuLabel>
            <TighterText>My Assistants</TighterText>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoadingAllAssistants && !assistants?.length ? (
            <span className="text-sm text-gray-600 flex items-center justify-start gap-1 p-2">
              Loading
              <Icons.LoaderCircle className="w-4 h-4 animate-spin" />
            </span>
          ) : (
            <>
              <DropdownMenuItem
                onSelect={handleNewAssistantClick}
                className="flex items-center justify-start gap-1"
              >
                <Icons.CirclePlus className="w-4 h-4" />
                <TighterText className="font-medium">New</TighterText>
              </DropdownMenuItem>
              {assistants.map((assistant) => (
                <AssistantItem
                  key={assistant.assistant_id}
                  assistant={assistant}
                  selectedAssistantId={selectedAssistant?.assistant_id}
                  onClick={() => {
                    if (
                      selectedAssistant?.assistant_id === assistant.assistant_id
                    ) {
                      setOpen(false);
                      return;
                    }
                    setSelectedAssistant(assistant);
                  }}
                />
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateEditAssistantDialog
        open={createEditDialogOpen}
        setOpen={setCreateEditDialogOpen}
        isEditing={false}
        createCustomAssistant={createCustomAssistant}
        editCustomAssistant={editCustomAssistant}
        isLoading={isLoadingAllAssistants}
      />
    </>
  );
}

export const AssistantSelect = React.memo(AssistantSelectComponent);
