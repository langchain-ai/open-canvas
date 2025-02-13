import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";

export const getLanguageTemplate = (
  language: ProgrammingLanguageOptions
): string => {
  switch (language) {
    case "javascript":
    case "typescript":
      return `import { } from "module";`;
    case "cpp":
      return `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;
    case "java":
      return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;
    case "php":
      return `<?php

echo "Hello, World!";
`;
    case "python":
      return `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`;
    case "html":
      return `<!DOCTYPE html>
<html>
  <body>
    <p>Hello, World!</p>
  </body>
</html>`;
    case "sql":
      return `SELECT "Hello, World!";`;
    default:
      return "// No quickstart content available for this language";
  }
};
