import { createNamespace, USER_RULES_STORE_KEY } from "../lib/store";
import { UserRules } from "../types";
import { BaseStore, LangGraphRunnableConfig } from "@langchain/langgraph";

const validateStore = (config: LangGraphRunnableConfig): BaseStore => {
  if (!config.store) {
    throw new Error("Store not found in config.");
  }
  return config.store;
};

export const getRulesFromStore = async (
  config: LangGraphRunnableConfig
): Promise<UserRules> => {
  const store = validateStore(config);
  const assistantId = config.configurable?.assistant_id;

  if (!assistantId) {
    throw new Error("Assistant ID not found in config.");
  }

  const namespace = createNamespace(assistantId);
  const rules = await store.get(namespace, USER_RULES_STORE_KEY);

  return {
    styleRules: rules?.value?.styleRules ?? null,
    contentRules: rules?.value?.contentRules ?? null,
  };
};

export const putRulesInStore = async (
  config: LangGraphRunnableConfig,
  rules: UserRules
): Promise<void> => {
  const store = validateStore(config);
  const assistantId = config.configurable?.assistant_id;

  if (!assistantId) {
    throw new Error("Assistant ID not found in config.");
  }

  const namespace = createNamespace(assistantId);
  await store.put(namespace, USER_RULES_STORE_KEY, rules);
};
