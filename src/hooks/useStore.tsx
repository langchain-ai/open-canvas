import { Reflections } from "@/types";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

export function useStore(assistantId: string | undefined) {
  const { toast } = useToast();
  const [reflections, setReflections] = useState<Reflections & { assistantId: string }>();

  useEffect(() => {
    if (!assistantId || typeof window === "undefined") return;
    // Don't re-fetch reflections if they already exist & are for the same assistant
    if ((reflections?.content || reflections?.styleRules) && reflections.assistantId === assistantId) return;
    
    getReflections();
  }, [assistantId]);

  const getReflections = async (): Promise<void> => {
    if (!assistantId) {
      return;
    }
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

    const { memories } = await res.json();
    setReflections({
      ...memories,
      assistantId,
    });
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
      })
    }
    return success;
  };

  return {
    reflections,
    deleteReflections,
  };
}
