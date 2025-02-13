"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import * as Icons from "lucide-react";
import React from "react";
import { TighterText } from "../ui/header";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { CreateEditAssistantDialog } from "./create-edit-assistant-dialog";
import { getIcon } from "./utils";
import { AssistantItem } from "./assistant-item";
import { Assistant } from "@langchain/langgraph-sdk";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAssistantContext } from "@/contexts/AssistantContext";

interface AssistantSelectProps {
  userId: string | undefined;
  chatStarted: boolean;
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
}

function AssistantSelectComponent(props: AssistantSelectProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<
    Assistant | undefined
  >();
  const [allDisabled, setAllDisabled] = useState(false);

  const {
    assistants,
    selectedAssistant,
    isLoadingAllAssistants,
    setSelectedAssistant,
    createCustomAssistant,
    editCustomAssistant,
    deleteAssistant,
  } = useAssistantContext();

  const handleNewAssistantClick = (event: Event) => {
    event.preventDefault();
    setCreateEditDialogOpen(true);
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    setAllDisabled(true);
    const res = await deleteAssistant(assistantId);
    if (res) {
      toast({
        title: "Assistant deleted",
        duration: 5000,
      });
    }
    setAllDisabled(false);
    return res;
  };

  const metadata = selectedAssistant?.metadata as Record<string, any>;

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(c) => {
          if (!c) {
            setEditingAssistant(undefined);
            setCreateEditDialogOpen(false);
          }
          setOpen(c);
          props.onOpenChange?.(c);
        }}
      >
        <DropdownMenuTrigger className="text-gray-600" asChild>
          <TooltipIconButton
            tooltip="Change assistant"
            variant="ghost"
            className={cn("size-7 mt-1", props.className)}
            delayDuration={200}
            style={{ color: metadata?.iconData?.iconColor || "#4b5563" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
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
                onSelect={(e) => {
                  handleNewAssistantClick(e);
                }}
                className="flex items-center justify-start gap-2"
                disabled={allDisabled}
              >
                <Icons.CirclePlus className="w-4 h-4" />
                <TighterText className="font-medium">New</TighterText>
              </DropdownMenuItem>
              {assistants.map((assistant) => (
                <AssistantItem
                  setAllDisabled={setAllDisabled}
                  allDisabled={allDisabled}
                  key={assistant.assistant_id}
                  assistant={assistant}
                  setEditModalOpen={setCreateEditDialogOpen}
                  setAssistantDropdownOpen={setOpen}
                  setEditingAssistant={setEditingAssistant}
                  deleteAssistant={handleDeleteAssistant}
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
        allDisabled={allDisabled}
        setAllDisabled={setAllDisabled}
        open={createEditDialogOpen}
        setOpen={(c) => {
          if (!c) {
            setEditingAssistant(undefined);
          }
          setCreateEditDialogOpen(c);
        }}
        userId={props.userId}
        isEditing={!!editingAssistant}
        assistant={editingAssistant}
        createCustomAssistant={async ({
          newAssistant,
          userId,
          successCallback,
        }) => {
          const res = await createCustomAssistant({
            newAssistant,
            userId,
            successCallback,
          });
          setOpen(false);
          return res;
        }}
        editCustomAssistant={async ({
          editedAssistant,
          assistantId,
          userId,
        }) => {
          const res = await editCustomAssistant({
            editedAssistant,
            assistantId,
            userId,
          });
          setOpen(false);
          return res;
        }}
        isLoading={isLoadingAllAssistants}
      />
    </>
  );
}

export const AssistantSelect = React.memo(AssistantSelectComponent);
