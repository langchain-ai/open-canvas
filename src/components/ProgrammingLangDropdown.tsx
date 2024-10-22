import { ProgrammingLanguageOptions } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Code } from "lucide-react";
import { Button } from "./ui/button";

const LANGUAGES: Array<{ label: string; key: ProgrammingLanguageOptions }> = [
  { label: "PHP", key: "php" },
  { label: "TypeScript", key: "typescript" },
  { label: "JavaScript", key: "javascript" },
  { label: "C++", key: "cpp" },
  { label: "Java", key: "java" },
  { label: "Python", key: "python" },
  { label: "HTML", key: "html" },
  { label: "SQL", key: "sql" },
];

export const ProgrammingLanguagesDropdown = ({
  handleSubmit,
  trigger,
}: {
  handleSubmit: (portLanguage: ProgrammingLanguageOptions) => void;
  trigger?: JSX.Element;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="transition-colors text-gray-600 flex items-center justify-center gap-2 w-[250px] h-[64px]"
          >
            New Code File
            <Code />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[600px] w-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DropdownMenuLabel>Languages</DropdownMenuLabel>
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.key}
            onSelect={() => handleSubmit(lang.key)}
            className="flex items-center justify-start gap-1"
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
