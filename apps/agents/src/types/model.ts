interface Model {
  modelName: string;
  invoke: (messages: any[]) => Promise<any>;
  bindTools: (tools: any[], options?: any) => Model;
  withConfig: (config: any) => Model;
  // Add other methods as necessary
}

export { Model };