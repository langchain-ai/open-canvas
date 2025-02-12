import {
  CirclePlus,
  WandSparkles,
  Trash2,
  LoaderCircle,
  Pencil,
} from "lucide-react";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomQuickAction } from "@opencanvas/shared/types";
import { NewCustomQuickActionDialog } from "./NewCustomQuickActionDialog";
import { useEffect, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TighterText } from "@/components/ui/header";
import { GraphInput } from "@opencanvas/shared/types";
import { User } from "@supabase/supabase-js";

export interface CustomQuickActionsProps {
  isTextSelected: boolean;
  assistantId: string | undefined;
  user: User | undefined;
  streamMessage: (params: GraphInput) => Promise<void>;
}

const DropdownMenuItemWithDelete = ({
  disabled,
  title,
  onDelete,
  onEdit,
  onClick,
}: {
  disabled: boolean;
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
      <DropdownMenuItem
        disabled={disabled}
        onSelect={onClick}
        className="w-full truncate"
      >
        {title}
      </DropdownMenuItem>
      <TooltipIconButton
        disabled={disabled}
        tooltip="Edit action"
        variant="ghost"
        onClick={onEdit}
        className={cn("ml-1", isHovering ? "visible" : "invisible")}
      >
        <Pencil className="text-[#575757] hover:text-black transition-colors ease-in" />
      </TooltipIconButton>
      <TooltipIconButton
        disabled={disabled}
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
  const { user, assistantId, streamMessage } = props;
  const {
    getCustomQuickActions,
    deleteCustomQuickAction,
    isLoadingQuickActions,
  } = useStore();
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

  const getAndSetCustomQuickActions = async (userId: string) => {
    const actions = await getCustomQuickActions(userId);
    setCustomQuickActions(actions);
  };

  useEffect(() => {
    if (typeof window === undefined || !assistantId || !user) return;
    getAndSetCustomQuickActions(user.id);
  }, [assistantId, user]);

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
    await streamMessage({
      customQuickActionId: id,
    });
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: "Failed to delete",
        description: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    try {
      const deletionSuccess = await deleteCustomQuickAction(
        id,
        customQuickActions || [],
        user.id
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
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        if (props.isTextSelected) return;
        setOpen(o);
      }}
    >
      <DropdownMenuTrigger className="fixed bottom-4 right-20" asChild>
        <TooltipIconButton
          tooltip={
            props.isTextSelected
              ? "Quick actions disabled while text is selected"
              : "Custom quick actions"
          }
          variant="outline"
          className={cn(
            "transition-colors w-[48px] h-[48px] p-0 rounded-xl",
            props.isTextSelected
              ? "cursor-default opacity-50 text-gray-400 hover:bg-background"
              : "cursor-pointer"
          )}
          delayDuration={400}
        >
          <WandSparkles
            className={cn(
              "w-[26px] h-[26px]",
              props.isTextSelected
                ? "text-gray-400"
                : "hover:text-gray-900 transition-colors"
            )}
          />
        </TooltipIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[600px] max-w-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DropdownMenuLabel>
          <TighterText>Custom Quick Actions</TighterText>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoadingQuickActions && !customQuickActions?.length ? (
          <span className="text-sm text-gray-600 flex items-center justify-start gap-1 p-2">
            Loading
            <LoaderCircle className="w-4 h-4 animate-spin" />
          </span>
        ) : !customQuickActions?.length ? (
          <TighterText className="text-sm text-gray-600 p-2">
            No custom quick actions found.
          </TighterText>
        ) : (
          <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {customQuickActions.map((action) => (
              <DropdownMenuItemWithDelete
                key={action.id}
                disabled={props.isTextSelected}
                onDelete={async () => await handleDelete(action.id)}
                title={action.title}
                onClick={async () => await handleQuickActionClick(action.id)}
                onEdit={() => openEditDialog(action.id)}
              />
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={props.isTextSelected}
          onSelect={handleNewActionClick}
          className="flex items-center justify-start gap-1"
        >
          <CirclePlus className="w-4 h-4" />
          <TighterText className="font-medium">New</TighterText>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <NewCustomQuickActionDialog
        user={user}
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
        getAndSetCustomQuickActions={getAndSetCustomQuickActions}
      />
    </DropdownMenu>
  );
}
