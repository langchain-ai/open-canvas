import { Reflections } from "@/types";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

export function useStore(assistantId: string | undefined) {
  const { toast } = useToast();
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [reflections, setReflections] = useState<
    Reflections & { assistantId: string; updatedAt: Date }
  >();

  useEffect(() => {
    if (!assistantId || typeof window === "undefined") return;
    // Don't re-fetch reflections if they already exist & are for the same assistant
    if (
      (reflections?.content || reflections?.styleRules) &&
      reflections.assistantId === assistantId
    )
      return;

    getReflections();
  }, [assistantId]);

  const getReflections = async (): Promise<void> => {
    if (!assistantId) {
      return;
    }
    setIsLoadingReflections(true);
    const res = await fetch("/api/store/get", {
      method: "POST",
      body: JSON.stringify({ assistantId }),
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
      body: JSON.stringify({ assistantId }),
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

  return {
    isLoadingReflections,
    reflections,
    deleteReflections,
    getReflections,
  };
}
