interface Store {
  get: (namespace: string[], key: string) => Promise<any>;
  put: (namespace: string[], key: string, value: any) => Promise<void>;
}

export { Store };
