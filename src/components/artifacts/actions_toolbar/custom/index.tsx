import { CirclePlus, WandSparkles } from "lucide-react";
import { GraphInput } from "@/hooks/useGraph";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomQuickAction } from "@/types";
import { NewCustomQuickActionDialog } from "./NewCustomQuickActionDialog";
import { useState } from "react";
import { DUMMY_QUICK_ACTIONS } from "@/lib/dummy";

export interface CustomQuickActionsProps {
  customQuickActions: CustomQuickAction[];
  assistantId: string;
  streamMessage: (input: GraphInput) => Promise<void>;
}

export function CustomQuickActions(props: CustomQuickActionsProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const customQuickActions = props.customQuickActions.length
    ? props.customQuickActions
    : DUMMY_QUICK_ACTIONS;

  const handleNewActionClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setDialogOpen(true);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="fixed bottom-4 right-20" asChild>
        <TooltipIconButton
          tooltip="Custom quick actions"
          variant="outline"
          className="transition-colors w-[48px] h-[48px] p-0 rounded-xl"
          delayDuration={400}
        >
          <WandSparkles className="w-[26px] h-[26px]" />
        </TooltipIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Custom Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleNewActionClick}
          className="flex items-center justify-start gap-1"
        >
          <CirclePlus className="w-4 h-4" />
          <p>New</p>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>My Actions</DropdownMenuLabel>
        {customQuickActions.map((action) => (
          <DropdownMenuItem key={action.id}>{action.title}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      <NewCustomQuickActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assistantId={props.assistantId}
      />
    </DropdownMenu>
  );
}
