import { BaseStore } from "@langchain/langgraph";
import { CustomQuickAction } from "@opencanvas/shared/types";
import { traceable } from "langsmith/traceable";

async function getCustomActionsFunc(
  store: BaseStore | undefined,
  inputs: {
    userId: string | undefined;
    customQuickActionId: string;
  }
): Promise<CustomQuickAction> {
  if (!store) {
    throw new Error("No store found.");
  }
  const userId = inputs.userId;
  if (!userId) {
    throw new Error("`user_id` not found in configurable");
  }

  const customActionsNamespace = ["custom_actions", userId];
  const actionsKey = "actions";
  const actions = await store.get(customActionsNamespace, actionsKey);
  const customQuickAction = actions?.value[inputs.customQuickActionId] as
    | CustomQuickAction
    | undefined;
  if (!customQuickAction) {
    throw new Error(
      `No custom quick action found from ID ${inputs.customQuickActionId}`
    );
  }
  return customQuickAction;
}

export const getCustomActions = traceable(getCustomActionsFunc, {
  name: "get_custom_actions",
});

async function setCustomActionsFunc(
  store: BaseStore | undefined,
  inputs: {
    userId: string | undefined;
    customQuickAction: CustomQuickAction;
  }
): Promise<void> {
  if (!store) {
    throw new Error("No store found.");
  }
  const userId = inputs.userId;
  if (!userId) {
    throw new Error("`user_id` not found in configurable");
  }

  const customActionsNamespace = ["custom_actions", userId];
  const actionsKey = "actions";
  await store.put(customActionsNamespace, actionsKey, inputs.customQuickAction);
}

export const setCustomActions = traceable(setCustomActionsFunc, {
  name: "set_custom_actions",
});
