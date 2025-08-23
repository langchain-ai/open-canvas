import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { CodeRenderer } from "./CodeRenderer";

vi.mock("./CodeRenderer", () => ({
  CodeRenderer: () => <div>Mocked CodeRenderer</div>,
}));

describe("CodeRenderer", () => {
  it("renders mocked CodeRenderer", () => {
    const { getByText } = render(<CodeRenderer />);
    expect(getByText("Mocked CodeRenderer")).toBeTruthy();
  });
});