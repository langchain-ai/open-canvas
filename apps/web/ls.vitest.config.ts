import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: [
      "**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "**/*.eval.?(c|m)[jt]s?(x)",
      "**/*.tsx",
    ],
    environment: "jsdom",
    reporters: ["default"],
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assistant-ui/react-markdown": path.resolve(__dirname, "./src/test/__mocks__/@assistant-ui/react-markdown.tsx"),
      "@uiw/react-codemirror": path.resolve(__dirname, "./src/test/__mocks__/@uiw/react-codemirror.tsx"),
    },
  },
});
