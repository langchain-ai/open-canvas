// Enhanced tests for LangGraph
import { describe, it, expect } from '@jest/globals';
import { graph } from "./index";

describe("OpenCanvas Graph", () => {
  it("should be defined", () => {
    expect(graph).toBeDefined();
  });

  it("should have the correct configuration", () => {
    expect(graph.config.runName).toBe("open_canvas");
  });

  it("should compile and run a trivial START→END transition", async () => {
    const state = { messages: [] }; // Minimal state to start the graph
    const result = await graph.invoke(state);
    expect(result).toBeDefined();
    expect(result.messages).toBeInstanceOf(Array);
  });

  // Additional smoke tests
  it("should handle multiple invocations without errors", async () => {
    const state = { messages: [] };
    for (let i = 0; i < 5; i++) {
      const result = await graph.invoke(state);
      expect(result).toBeDefined();
      expect(result.messages).toBeInstanceOf(Array);
    }
  });

  it("should handle different initial states", async () => {
    const initialState1 = { messages: ["Hello"] };
    const result1 = await graph.invoke(initialState1);
    expect(result1).toBeDefined();
    expect(result1.messages).toContain("Hello");

    const initialState2 = { messages: ["World"] };
    const result2 = await graph.invoke(initialState2);
    expect(result2).toBeDefined();
    expect(result2.messages).toContain("World");
  });
});
