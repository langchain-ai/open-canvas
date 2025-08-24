/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { makeOpenCanvasGraphForSmoke } from "./index.smoke";

describe("open_canvas compile-only (smoke)", () => {
  it("compiles a trimmed graph without side effects", () => {
    const g = makeOpenCanvasGraphForSmoke();
    expect(g).toBeTruthy();
  });
});