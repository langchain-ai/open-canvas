import * as Icons from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import React from "react";
import debounce from "lodash/debounce";
import startCase from "lodash/startCase";
import uniq from "lodash/uniq";
import uniqBy from "lodash/uniqBy";
import { Button } from "../ui/button";

type KeyofIcons = keyof typeof Icons;

const prettifyIconLabel = (iconName: string) => {
  iconName = iconName
    .replace("Icon", "")
    .replace("icon", "")
    .replace("Lucide", "");
  return startCase(iconName);
};

export function IconSelect({
  selectedIcon,
  setSelectedIcon,
  hasSelectedIcon,
  iconColor,
  allDisabled,
}: {
  allDisabled: boolean;
  selectedIcon: KeyofIcons;
  setSelectedIcon: Dispatch<SetStateAction<KeyofIcons>>;
  hasSelectedIcon: boolean;
  iconColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startIndex, setStartIndex] = useState(0);
  const WINDOW_SIZE = 300;
  const BUFFER_SIZE = 100;

  // Get all icon names and memoize the filtered results
  const filteredIcons: Array<{ value: string; label: string }> = useMemo(() => {
    const iconItems = uniq(
      Object.keys(Icons).filter((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    return uniqBy(
      iconItems?.map((iconName) => ({
        value: iconName,
        label: prettifyIconLabel(iconName),
      })),
      "label"
    );
  }, [searchTerm]);

  // handleScroll handles both up and down scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate scroll percentage
    const scrollPercentage = scrollPosition / (scrollHeight - clientHeight);

    // Adjust startIndex based on scroll direction
    if (
      scrollPercentage > 0.7 &&
      startIndex + WINDOW_SIZE < filteredIcons.length
    ) {
      setStartIndex(
        Math.min(startIndex + BUFFER_SIZE, filteredIcons.length - WINDOW_SIZE)
      );
    } else if (scrollPercentage < 0.3 && startIndex > 0) {
      setStartIndex(Math.max(0, startIndex - BUFFER_SIZE));
    }
  };

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
      }, 300),
    [] // Empty dependency array since we don't want to recreate the debounced function
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(c) => {
        if (!c) {
          setStartIndex(0);
          setSearchTerm("");
          debouncedSearch.cancel(); // Cancel any pending debounced calls
        }
        setOpen(c);
      }}
    >
      <DropdownMenuTrigger className="w-full" asChild disabled={allDisabled}>
        {hasSelectedIcon ? (
          <Button
            variant="outline"
            className="flex flex-row items-center justify-between"
            disabled={allDisabled}
          >
            <div className="flex flex-row items-center gap-2 justify-start">
              <span style={{ color: iconColor }}>
                {React.createElement(Icons[selectedIcon] as React.ElementType)}
              </span>
              {prettifyIconLabel(selectedIcon)}
            </div>
            {open ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
          </Button>
        ) : (
          <Button
            disabled={allDisabled}
            variant="outline"
            className="flex justify-between"
          >
            Select an icon {open ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="h-[400px] w-[400px] ml-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 p-2">
          <DropdownMenuLabel className="px-2 pb-2">Icons</DropdownMenuLabel>
          <Input
            disabled={allDisabled}
            placeholder="Search icons..."
            onChange={(e) => debouncedSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="mb-2"
          />
          <DropdownMenuSeparator />
        </div>
        <div className="overflow-y-auto max-h-[420px]" onScroll={handleScroll}>
          {startIndex > 0 && (
            <div className="py-2 text-center text-sm text-gray-500">
              Scroll up for previous icons
            </div>
          )}
          {uniq(filteredIcons)
            .slice(startIndex, startIndex + WINDOW_SIZE)
            ?.map((iconItem) => (
              <DropdownMenuItem
                key={iconItem.value}
                onClick={() => {
                  setSelectedIcon(iconItem.value as KeyofIcons);
                }}
                className="flex flex-row items-center gap-2 justify-start w-full"
                disabled={allDisabled}
              >
                <span style={{ color: iconColor }}>
                  {React.createElement(
                    Icons[iconItem.value as KeyofIcons] as React.ElementType
                  )}
                </span>
                {iconItem.label}
              </DropdownMenuItem>
            ))}
          {startIndex + WINDOW_SIZE < filteredIcons.length && (
            <div className="py-2 text-center text-sm text-gray-500">
              Scroll down for more icons
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
