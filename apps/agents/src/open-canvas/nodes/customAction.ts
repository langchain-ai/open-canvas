export function customAction(config: any): { userId: string | undefined } {
  const userId = config.configurable?.user_id;
  return { userId };
}
