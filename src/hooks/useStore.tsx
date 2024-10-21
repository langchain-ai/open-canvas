import { CustomQuickAction, Reflections } from "@/types";
import { useState } from "react";
import { useToast } from "./use-toast";

export function useStore(assistantId: string | undefined) {
  const { toast } = useToast();
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [reflections, setReflections] = useState<
    Reflections & { assistantId: string; updatedAt: Date }
  >();

  const getReflections = async (): Promise<void> => {
    if (!assistantId) {
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

    setReflections({
      ...item.value,
      updatedAt: new Date(item.updatedAt),
      assistantId,
    });
    setIsLoadingReflections(false);
  };

  const deleteReflections = async (): Promise<boolean> => {
    if (!assistantId) {
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
    if (!assistantId) {
      return undefined;
    }
    setIsLoadingReflections(true);
    const res = await fetch("/api/store/get", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["custom_actions", assistantId],
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
  };

  const deleteCustomQuickAction = async (id: string): Promise<boolean> => {
    if (!assistantId) {
      return false;
    }
    const res = await fetch("/api/store/delete/id", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["custom_actions", assistantId],
        key: "actions",
        id,
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
    action: CustomQuickAction
  ): Promise<boolean> => {
    if (!assistantId) {
      return false;
    }
    setIsLoadingReflections(true);
    const res = await fetch("/api/store/put", {
      method: "POST",
      body: JSON.stringify({
        namespace: ["custom_actions", assistantId],
        key: "actions",
        value: {
          [action.id]: action,
        },
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
    deleteReflections,
    getReflections,
    deleteCustomQuickAction,
    getCustomQuickActions,
    createCustomQuickAction,
  };
}
