import {
  CustomQuickAction,
  Reflections,
  ContextDocument,
} from "@opencanvas/shared/types";
import { useState } from "react";
import { useToast } from "./use-toast";
import { Item } from "@langchain/langgraph";
import { CONTEXT_DOCUMENTS_NAMESPACE } from "@opencanvas/shared/constants";
import { createClient } from "./utils";
import { createSupabaseClient } from "@/lib/supabase/client";

export function useStore() {
  const { toast } = useToast();
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [isLoadingQuickActions, setIsLoadingQuickActions] = useState(false);
  const [reflections, setReflections] = useState<
    Reflections & { assistantId: string; updatedAt: Date }
  >();

  const getReflections = async (assistantId: string): Promise<void> => {
    setIsLoadingReflections(true);

    const client = await createClient();
    const supabaseClient = createSupabaseClient();
    let userId: string | undefined;
    try {
      userId = (await supabaseClient.auth.getUser()).data.user?.id;
    } catch (e) {
      console.error("Failed to get user ID", e);
    }
    if (!userId) {
      toast({
        title: "Failed to get user ID",
        description: "Please try again later.",
      });
      return;
    }

    const reflectionsNamespace = ["memories", userId, assistantId];
    const reflectionsKey = "reflection";

    const item = await client.store.getItem(
      reflectionsNamespace,
      reflectionsKey
    );

    if (!item?.value) {
      setIsLoadingReflections(false);
      // No reflections found. Return early.
      setReflections(undefined);
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

  const deleteReflections = async (assistantId: string): Promise<boolean> => {
    try {
      const client = await createClient();

      const reflectionsNamespace = ["memories", "userId", assistantId];
      const reflectionsKey = "reflection";

      await client.store.deleteItem(reflectionsNamespace, reflectionsKey);

      setReflections(undefined);
      return true;
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to delete reflections",
        description: "Please try again later.",
      });
      return false;
    }
  };

  const getCustomQuickActions = async (
    userId: string
  ): Promise<CustomQuickAction[] | undefined> => {
    setIsLoadingQuickActions(true);
    try {
      const client = await createClient();
      const customActionsNamespace = ["custom_actions", userId];
      const actionsKey = "actions";
      const item = await client.store.getItem(
        customActionsNamespace,
        actionsKey
      );

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
    rest: CustomQuickAction[],
    userId: string
  ): Promise<boolean> => {
    try {
      const valuesWithoutDeleted = rest.reduce<
        Record<string, CustomQuickAction>
      >((acc, action) => {
        if (action.id !== id) {
          acc[action.id] = action;
        }
        return acc;
      }, {});

      const client = await createClient();
      const customActionsNamespace = ["custom_actions", userId];
      const actionsKey = "actions";
      await client.store.putItem(
        customActionsNamespace,
        actionsKey,
        valuesWithoutDeleted
      );
      return true;
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to delete custom quick action",
        description: "Please try again later.",
      });
      return false;
    }
  };

  const createCustomQuickAction = async (
    newAction: CustomQuickAction,
    rest: CustomQuickAction[],
    userId: string
  ): Promise<boolean> => {
    try {
      const client = await createClient();

      const customActionsNamespace = ["custom_actions", userId];
      const actionsKey = "actions";

      const newValue = rest.reduce<Record<string, CustomQuickAction>>(
        (acc, action) => {
          acc[action.id] = action;
          return acc;
        },
        {}
      );

      newValue[newAction.id] = newAction;

      await client.store.putItem(customActionsNamespace, actionsKey, newValue);
      return true;
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to create custom quick action",
        description: "Please try again later.",
      });
      return false;
    }
  };

  const editCustomQuickAction = async (
    editedAction: CustomQuickAction,
    rest: CustomQuickAction[],
    userId: string
  ): Promise<boolean> => {
    try {
      const client = await createClient();

      const customActionsNamespace = ["custom_actions", userId];
      const actionsKey = "actions";

      const newValue = rest.reduce<Record<string, CustomQuickAction>>(
        (acc, action) => {
          acc[action.id] = action;
          return acc;
        },
        {}
      );

      newValue[editedAction.id] = editedAction;

      await client.store.putItem(customActionsNamespace, actionsKey, newValue);
      return true;
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to edit custom quick action",
        description: "Please try again later.",
      });
      return false;
    }
  };

  const putContextDocuments = async ({
    assistantId,
    documents,
  }: {
    assistantId: string;
    documents: ContextDocument[];
  }): Promise<void> => {
    try {
      const client = await createClient();

      const contextDocKey = assistantId;

      const value = {
        documents,
      };

      await client.store.putItem(
        CONTEXT_DOCUMENTS_NAMESPACE,
        contextDocKey,
        value
      );
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to set context documents.",
        description: "Please try again later.",
      });
    }
  };

  const getContextDocuments = async (
    assistantId: string
  ): Promise<ContextDocument[] | undefined> => {
    try {
      const client = await createClient();

      const contextDocKey = assistantId;

      const item = await client.store.getItem(
        CONTEXT_DOCUMENTS_NAMESPACE,
        contextDocKey
      );
      if (!item?.value?.documents) {
        return undefined;
      }

      return item.value.documents;
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to get context documents.",
        description: "Please try again later.",
      });
    }
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
    putContextDocuments,
    getContextDocuments,
  };
}
