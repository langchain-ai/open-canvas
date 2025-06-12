import { useState } from "react";
import { Menu, X, FileText, Code } from "lucide-react";
import { ArtifactV3, ArtifactCodeV3, ArtifactMarkdownV3, TextHighlight } from "@opencanvas/shared/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

interface ArtifactVersionsMenuProps {
  artifact: ArtifactV3;
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  setSelectedArtifact: (index: number) => void;
  setSelectedBlocks: (blocks: TextHighlight | undefined) => void;
  isStreaming?: boolean;
}

export function ArtifactVersionsMenu({
  artifact,
  currentArtifactContent,
  setSelectedArtifact,
  setSelectedBlocks,
  isStreaming = false,
}: ArtifactVersionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleVersionSelect = (index: number) => {
    if (!isStreaming && index !== currentArtifactContent.index) {
      // 清理文本選中狀態以避免版本間的狀態不同步
      setSelectedBlocks(undefined);
      setSelectedArtifact(index);
    }
    setIsOpen(false);
  };

  const getVersionTypeIcon = (content: ArtifactCodeV3 | ArtifactMarkdownV3) => {
    return content.type === "code" ? (
      <Code className="w-4 h-4" />
    ) : (
      <FileText className="w-4 h-4" />
    );
  };

  const getVersionLabel = (content: ArtifactCodeV3 | ArtifactMarkdownV3) => {
    const baseTitle = content.title || `${content.type === "code" ? "Code" : "Text"} v${content.index}`;
    if (content.type === "code" && content.language && content.language !== "other") {
      return `${baseTitle} (${content.language})`;
    }
    return baseTitle;
  };

  const getVersionPreview = (content: ArtifactCodeV3 | ArtifactMarkdownV3) => {
    if (content.type === "code") {
      const preview = content.code.slice(0, 60).replace(/\n/g, " ");
      return preview.length < content.code.length ? `${preview}...` : preview;
    } else {
      const preview = content.fullMarkdown.slice(0, 60).replace(/\n/g, " ");
      return preview.length < content.fullMarkdown.length ? `${preview}...` : preview;
    }
  };

  // 按照 index 排序版本
  const sortedVersions = [...artifact.contents].sort((a, b) => a.index - b.index);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <TooltipIconButton
          tooltip={`View all versions (${artifact.contents.length})`}
          variant="ghost"
          className="w-8 h-8 ml-1"
          delayDuration={400}
          disabled={isStreaming}
        >
          {isOpen ? (
            <X className="w-4 h-4 text-gray-600" />
          ) : (
            <Menu className="w-4 h-4 text-gray-600" />
          )}
        </TooltipIconButton>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 max-h-96 overflow-y-auto" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <span>Artifact Versions ({artifact.contents.length})</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {sortedVersions.map((version) => {
          const isCurrentVersion = version.index === currentArtifactContent.index;
          
          return (
            <DropdownMenuItem
              key={version.index}
              className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                isCurrentVersion && "bg-accent/50",
                isStreaming && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleVersionSelect(version.index)}
              disabled={isStreaming}
            >
              <div className="flex items-center gap-2 w-full">
                {getVersionTypeIcon(version)}
                <span className="font-medium text-sm flex-1">
                  {getVersionLabel(version)}
                </span>
                {isCurrentVersion && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Current
                  </span>
                )}
              </div>
              
              {/* 版本預覽 */}
              <div className="text-xs text-muted-foreground pl-6 mt-1 overflow-hidden" style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const
              }}>
                {getVersionPreview(version)}
              </div>
              
              {/* 版本號 */}
              <div className="text-xs text-muted-foreground pl-6">
                Version {version.index}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {artifact.contents.length === 0 && (
          <DropdownMenuItem disabled className="text-center text-muted-foreground">
            No versions available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
