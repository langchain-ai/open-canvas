import {
  CirclePlus,
  WandSparkles,
  Trash2,
  LoaderCircle,
  Pencil,
} from "lucide-react";
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
import { useEffect, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface CustomQuickActionsProps {
  assistantId: string | undefined;
  streamMessage: (input: GraphInput) => Promise<void>;
}

const DropdownMenuItemWithDelete = ({
  title,
  onDelete,
  onEdit,
  onClick,
}: {
  title: string;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  onClick: () => Promise<void>;
}) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="flex flex-row gap-0 items-center justify-between w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <DropdownMenuItem onSelect={onClick} className="w-full truncate">
        {title}
      </DropdownMenuItem>
      <TooltipIconButton
        tooltip="Edit action"
        variant="ghost"
        onClick={onEdit}
        className={cn("ml-1", isHovering ? "visible" : "invisible")}
      >
        <Pencil className="text-[#575757] hover:text-black transition-colors ease-in" />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Delete action"
        variant="ghost"
        onClick={onDelete}
        className={cn(isHovering ? "visible" : "invisible")}
      >
        <Trash2 className="text-[#575757] hover:text-red-500 transition-colors ease-in" />
      </TooltipIconButton>
    </div>
  );
};

export function CustomQuickActions(props: CustomQuickActionsProps) {
  const {
    getCustomQuickActions,
    deleteCustomQuickAction,
    isLoadingQuickActions,
  } = useStore(props.assistantId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingId, setIsEditingId] = useState<string>();
  const [customQuickActions, setCustomQuickActions] =
    useState<CustomQuickAction[]>();

  const openEditDialog = (id: string) => {
    setIsEditing(true);
    setDialogOpen(true);
    setIsEditingId(id);
  };

  const getAndSetCustomQuickActions = async () => {
    const actions = await getCustomQuickActions();
    setCustomQuickActions(actions);
  };

  useEffect(() => {
    if (typeof window === undefined || !props.assistantId) return;
    getAndSetCustomQuickActions();
  }, [props.assistantId]);

  const handleNewActionClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false);
    setIsEditingId(undefined);
    setDialogOpen(true);
  };

  const handleQuickActionClick = async (id: string): Promise<void> => {
    setOpen(false);
    setIsEditing(false);
    setIsEditingId(undefined);
    await props.streamMessage({
      customQuickActionId: id,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const deletionSuccess = await deleteCustomQuickAction(
        id,
        customQuickActions || []
      );
      if (deletionSuccess) {
        toast({
          title: "Custom quick action deleted successfully",
        });
        setCustomQuickActions((actions) => {
          if (!actions) return actions;
          return actions.filter((action) => action.id !== id);
        });
      } else {
        toast({
          title: "Failed to delete custom quick action",
          variant: "destructive",
        });
      }
    } catch (_) {
      toast({
        title: "Failed to delete custom quick action",
        variant: "destructive",
      });
    }
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
      <DropdownMenuContent className="max-h-[600px] max-w-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DropdownMenuLabel>Custom Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleNewActionClick}
          className="flex items-center justify-start gap-1"
        >
          <CirclePlus className="w-4 h-4" />
          <p className="font-medium">New</p>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>My Actions</DropdownMenuLabel>
        {isLoadingQuickActions && !customQuickActions?.length ? (
          <span className="text-sm text-gray-600 flex items-center justify-start gap-1 p-2">
            Loading
            <LoaderCircle className="w-4 h-4 animate-spin" />
          </span>
        ) : !customQuickActions?.length ? (
          <p className="text-sm text-gray-600 p-2">
            No custom quick actions found.
          </p>
        ) : (
          <>
            {customQuickActions.map((action) => (
              <DropdownMenuItemWithDelete
                key={action.id}
                onDelete={async () => await handleDelete(action.id)}
                title={action.title}
                onClick={async () => await handleQuickActionClick(action.id)}
                onEdit={() => openEditDialog(action.id)}
              />
            ))}
          </>
        )}
      </DropdownMenuContent>
      <NewCustomQuickActionDialog
        allQuickActions={customQuickActions || []}
        isEditing={isEditing}
        open={dialogOpen}
        onOpenChange={(c) => {
          setDialogOpen(c);
          if (!c) {
            setIsEditing(false);
          }
        }}
        customQuickAction={
          isEditing && isEditingId
            ? customQuickActions?.find((a) => a.id === isEditingId)
            : undefined
        }
        assistantId={props.assistantId}
        getAndSetCustomQuickActions={getAndSetCustomQuickActions}
      />
    </DropdownMenu>
  );
}
