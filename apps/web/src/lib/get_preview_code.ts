const reactImportRegex =
  /^import\s+(React(?:,\s*\{[^}]+\})?|\{[^}]+\})\s+from\s+['"]react['"];?/gm;

export const getPreviewCode = (code: string): string => {
  const matches = Array.from(code.matchAll(reactImportRegex));
  const namedBindings = new Set<string>();

  // Strip any import statements from the generated code
  for (const match of matches) {
    const imported = match[1];

    if (imported.includes("{")) {
      const names = imported
        .replace(/React,?/, "")
        .replace(/[{}]/g, "")
        .split(",")
        .map((name) => name.trim());

      names.forEach((n) => namedBindings.add(n));
    }
  }

  let transformed = code.replace(reactImportRegex, "").trim();

  namedBindings.forEach((name) => {
    const usageRegex = new RegExp(`\\b${name}\\b`, "g");
    transformed = transformed.replace(usageRegex, `React.${name}`);
  });

  // Replace "export default X" with "render(X)" to display
  transformed = transformed.replace(
    /export\s+default\s+([a-zA-Z_$][\w$]*)\s*;/,
    "render($1);"
  );

  return transformed;
};
