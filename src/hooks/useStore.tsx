import { CustomQuickAction, Reflections } from "@/types";
import { useState } from "react";
import { useToast } from "./use-toast";
import { useThread } from "./useThread";
import { useUser } from "./useUser";

export function useStore() {
  const { toast } = useToast();
  const { user } = useUser();
  const { assistantId } = useThread();
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [isLoadingQuickActions, setIsLoadingQuickActions] = useState(false);
  const [reflections, setReflections] = useState<
    Reflections & { assistantId: string; updatedAt: Date }
  >();

  const getReflections = async (): Promise<void> => {
    if (!assistantId) {
      toast({
        title: "Error",
        description: "Assistant not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsLoadingReflections(true);
    const res = await fetch("/api/store/get", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["memories", assistantId],
        key: "reflection",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return;
    }

    const { item } = await res.json();

    if (!item?.value) {
      setIsLoadingReflections(false);
      // No reflections found. Return early.
      return;
    }

    let styleRules = item.value.styleRules ?? [];
    let content = item.value.content ?? [];
    try {
      styleRules =
        typeof styleRules === "string" ? JSON.parse(styleRules) : styleRules;
      content = typeof content === "string" ? JSON.parse(content) : content;
    } catch (e) {
      console.error("Failed to parse reflections", e);
      styleRules = [];
      content = [];
    }

    setReflections({
      ...item.value,
      styleRules,
      content,
      updatedAt: new Date(item.updatedAt),
      assistantId,
    });
    setIsLoadingReflections(false);
  };

  const deleteReflections = async (): Promise<boolean> => {
    if (!assistantId) {
      toast({
        title: "Error",
        description: "Assistant not found",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }

    const res = await fetch("/api/store/delete", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["memories", assistantId],
        key: "reflection",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return false;
    }

    const { success } = await res.json();
    if (success) {
      setReflections(undefined);
    } else {
      toast({
        title: "Failed to delete reflections",
        description: "Please try again later.",
      });
    }
    return success;
  };

  const getCustomQuickActions = async (): Promise<
    CustomQuickAction[] | undefined
  > => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return undefined;
    }

    setIsLoadingQuickActions(true);
    try {
      const res = await fetch("/api/store/get", {
        method: "POST",
        body: JSON.stringify({
          namespace: ["custom_actions", user.id],
          key: "actions",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        return undefined;
      }

      const { item } = await res.json();
      if (!item?.value) {
        return undefined;
      }
      return Object.values(item?.value);
    } finally {
      setIsLoadingQuickActions(false);
    }
  };

  const deleteCustomQuickAction = async (
    id: string,
    rest: CustomQuickAction[]
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }

    const valuesWithoutDeleted = rest.reduce<Record<string, CustomQuickAction>>(
      (acc, action) => {
        if (action.id !== id) {
          acc[action.id] = action;
        }
        return acc;
      },
      {}
    );

    const res = await fetch("/api/store/put", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["custom_actions", user.id],
        key: "actions",
        value: valuesWithoutDeleted,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return false;
    }

    const { success } = await res.json();
    return success;
  };

  const createCustomQuickAction = async (
    newAction: CustomQuickAction,
    rest: CustomQuickAction[]
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }

    const newValue = rest.reduce<Record<string, CustomQuickAction>>(
      (acc, action) => {
        acc[action.id] = action;
        return acc;
      },
      {}
    );

    newValue[newAction.id] = newAction;
    const res = await fetch("/api/store/put", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["custom_actions", user.id],
        key: "actions",
        value: newValue,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return false;
    }

    const { success } = await res.json();
    return success;
  };

  const editCustomQuickAction = async (
    editedAction: CustomQuickAction,
    rest: CustomQuickAction[]
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }

    const newValue = rest.reduce<Record<string, CustomQuickAction>>(
      (acc, action) => {
        acc[action.id] = action;
        return acc;
      },
      {}
    );

    newValue[editedAction.id] = editedAction;
    const res = await fetch("/api/store/put", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["custom_actions", user.id],
        key: "actions",
        value: newValue,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return false;
    }

    const { success } = await res.json();
    return success;
  };

  return {
    isLoadingReflections,
    reflections,
    isLoadingQuickActions,
    deleteReflections,
    getReflections,
    deleteCustomQuickAction,
    getCustomQuickActions,
    editCustomQuickAction,
    createCustomQuickAction,
  };
}
