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
import { cn } from "@/lib/utils";
import { getIcon } from "./utils";

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
  const metadata = assistant.metadata as Record<string, any>;

  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        "flex items-center justify-start gap-2",
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
  );
}

interface AssistantSelectProps {
  userId: string | undefined;
}

function AssistantSelectComponent(props: AssistantSelectProps) {
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
    },
  } = useGraphContext();

  const handleNewAssistantClick = (event: Event) => {
    event.preventDefault();
    setCreateEditDialogOpen(true);
  };

  const metadata = selectedAssistant?.metadata as Record<string, any>;

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="text-gray-600" asChild>
          <TooltipIconButton
            tooltip="Change assistant"
            variant="ghost"
            delayDuration={200}
            className="w-8 h-8 transition-colors ease-in-out duration-200"
            style={{ color: metadata?.iconData?.iconColor || "#4b5563" }}
          >
            {getIcon(metadata?.iconData?.iconName as string | undefined)}
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
                className="flex items-center justify-start gap-2"
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
        userId={props.userId}
        isEditing={false}
        createCustomAssistant={async (
          newAssistant,
          userId,
          successCallback
        ) => {
          const res = await createCustomAssistant(
            newAssistant,
            userId,
            successCallback
          );
          setOpen(false);
          return res;
        }}
        editCustomAssistant={async (editedAssistant, assistantId, userId) => {
          const res = await editCustomAssistant(
            editedAssistant,
            assistantId,
            userId
          );
          setOpen(false);
          return res;
        }}
        isLoading={isLoadingAllAssistants}
      />
    </>
  );
}

export const AssistantSelect = React.memo(AssistantSelectComponent);
