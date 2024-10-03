import { DEFAULT_SYSTEM_RULES } from "@/constants";
import { createNamespace, USER_RULES_STORE_KEY } from "@/lib/store";
import { UserRules } from "@/types";
import { useState, useEffect } from "react";
import { useToast } from "./use-toast";

const DEFAULT_SYSTEM_RULES_STRING = `- ${DEFAULT_SYSTEM_RULES.join("\n- ")}`;

export interface UseRulesInput {
  assistantId: string | undefined;
  userId: string | undefined;
}

export function useRules({ assistantId, userId }: UseRulesInput) {
  const { toast } = useToast();
  const [systemRules, setSystemRules] = useState<string>();
  const [isLoadingSystemRules, setIsLoadingSystemRules] = useState(false);
  const [isSavingSystemRules, setIsSavingSystemRules] = useState(false);
  const [isLoadingUserRules, setIsLoadingUserRules] = useState(false);
  const [userRules, setUserRules] = useState<UserRules | undefined>();

  useEffect(() => {
    if (!assistantId) return;

    const fetchRules = async () => {
      if (!systemRules) {
        await getSystemRules();
      }
      if (!userRules) {
        await getUserRules();
      }
    };

    void fetchRules();
  }, [assistantId]);

  const getUserRules = async (): Promise<void> => {
    if (!assistantId) return;
    setIsLoadingUserRules(true);
    try {
      const namespace = encodeURIComponent(
        createNamespace(assistantId).join(".")
      );
      const queryParams = new URLSearchParams({
        namespace,
        key: USER_RULES_STORE_KEY,
      });
      const fullUrl = `/api/store/get?${queryParams.toString()}`;
      const response = await fetch(fullUrl);

      if (!response.ok) {
        toast({
          title: "An error occurred fetching user rules",
        });
        return;
      }

      const rules = await response.json();
      if (!rules || !rules.value) {
        // Successfully hit API, no rules yet stored.
        // no-op
        return;
      }

      setUserRules(rules.value);
    } catch (e) {
      toast({
        title: "An error occurred fetching user rules",
      });
    } finally {
      setIsLoadingUserRules(false);
    }
  };

  const getSystemRules = async () => {
    if (!assistantId || assistantId === "" || !userId || userId === "") return;
    setIsLoadingSystemRules(true);

    try {
      const queryParams = new URLSearchParams({ assistantId, userId });
      const fullUrl = `/api/system_rules/get?${queryParams.toString()}`;
      const response = await fetch(fullUrl);

      if (!response.ok) {
        setSystemRules(DEFAULT_SYSTEM_RULES_STRING);
      }

      const data = await response.json();
      if (data?.system_rules) {
        setSystemRules(data.system_rules);
      } else {
        setSystemRules(DEFAULT_SYSTEM_RULES_STRING);
      }
    } finally {
      setIsLoadingSystemRules(false);
    }
  };

  const setSystemRulesAndSave = async (newSystemRules: string) => {
    if (!assistantId || assistantId === "" || !userId || userId === "") return;
    setIsSavingSystemRules(true);

    try {
      setSystemRules(newSystemRules);
      await fetch("/api/system_rules/put", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId,
          userId,
          systemRules: newSystemRules,
        }),
      });
    } finally {
      setIsSavingSystemRules(false);
    }
  };

  return {
    getSystemRules,
    setSystemRules,
    setSystemRulesAndSave,
    systemRules,
    isLoadingSystemRules,
    isSavingSystemRules,
    userRules,
    isLoadingUserRules,
    getUserRules,
  };
}
