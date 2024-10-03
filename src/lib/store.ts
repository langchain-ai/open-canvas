export const USER_RULES_STORE_KEY = "rules";

export const createNamespace = (assistantId: string) => {
  return ["assistant_id", assistantId, "userRules"];
};
