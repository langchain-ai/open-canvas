interface Store {
  get: (namespace: string[], key: string) => Promise<any>;
  // Add other methods as necessary
}

export { Store };