// Function to strip tool_choice from model initialization options
export function stripToolChoice(modelInitOpts: any): any {
  if (modelInitOpts && "tool_choice" in modelInitOpts) {
    const { tool_choice, ...rest } = modelInitOpts;
    return rest;
  }
  return modelInitOpts;
}
