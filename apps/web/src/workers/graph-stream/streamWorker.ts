import { StreamWorkerMessage, StreamConfig } from "./streamWorker.types";

export class StreamWorkerService {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL("./stream.worker.ts", import.meta.url));
  }

  async *streamData(config: StreamConfig): AsyncGenerator<any, void, unknown> {
    this.worker.postMessage(config);

    while (true) {
      const event: MessageEvent<StreamWorkerMessage> = await new Promise(
        (resolve) => {
          this.worker.onmessage = resolve;
        }
      );

      const { type, data, error } = event.data;

      if (type === "error") {
        throw new Error(error);
      }

      if (type === "chunk" && data) {
        yield JSON.parse(data);
      }

      if (type === "done") {
        break;
      }
    }
  }

  terminate() {
    this.worker.terminate();
  }
}
