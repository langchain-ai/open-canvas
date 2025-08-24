import { describe, it, expect } from 'vitest';
import { StateGraph, END } from '@langchain/langgraph';

describe('Minimal StateGraph smoke test', () => {
  it('compiles and conditionally runs no-op', async () => {
    const graph = new StateGraph({
      channels: {
        step: {
          type: 'string',
          required: false,
        },
      },
    });

    graph.addNode('noop', () => ({}));
    graph.setEntryPoint('noop');
    graph.addEdge('noop', END);

    const compiledGraph = graph.compile();

    if (process.env.OPEN_CANVAS_SMOKE === '1') {
      await expect(compiledGraph.invoke({})).resolves.not.toThrow();
    }
  });
});

describe('Minimal StateGraph smoke test', () => {
  it('compiles and runs no-op', async () => {
    const graph = new StateGraph({
      channels: {
        step: {
          type: 'string',
          required: false,
        },
      },
    });

    graph.addNode('noop', () => ({}));
    graph.setEntryPoint('noop');
    graph.addEdge('noop', END);

    const compiledGraph = graph.compile();
    await expect(compiledGraph.invoke({})).resolves.not.toThrow();
  });
});
