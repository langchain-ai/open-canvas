import { useToast } from "@/hooks/use-toast";
import { GraphInput } from "@/hooks/useGraph";
import { convertToOpenAIFormat } from "@/lib/convert_messages";
import { newlineToCarriageReturn } from "@/lib/normalize_string";
import { cn } from "@/lib/utils";
import { Artifact, ProgrammingLanguageOptions, Reflections } from "@/types";
import { EditorView } from "@codemirror/view";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { CircleArrowUp, Eye, PencilLine, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ReflectionsDialog } from "../reflections-dialog/ReflectionsDialog";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ActionsToolbar, CodeToolBar } from "./actions_toolbar";
import { CodeRenderer } from "./CodeRenderer";
import { TextRenderer } from "./TextRenderer";

export interface ArtifactRendererProps {
  artifact: Artifact | undefined;
  setArtifactContent: (id: string, content: string) => void;
  streamMessage: (input: GraphInput) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;
  setSelectedArtifactById: (id: string | undefined) => void;
  messages: BaseMessage[];
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingReflections: boolean;
  reflections: (Reflections & { updatedAt: Date }) | undefined;
  handleDeleteReflections: () => Promise<boolean>;
  handleGetReflections: () => Promise<void>;
}

interface SelectionBox {
  top: number;
  left: number;
  text: string;
}

export function ArtifactRenderer(props: ArtifactRendererProps) {
  const { toast } = useToast();
  const editorRef = useRef<EditorView | null>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox>();
  const [selectionIndexes, setSelectionIndexes] = useState<{
    start: number;
    end: number;
  }>();
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && contentRef.current) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText) {
        const rects = range.getClientRects();
        const firstRect = rects[0];
        const lastRect = rects[rects.length - 1];
        const contentRect = contentRef.current.getBoundingClientRect();

        const boxWidth = 400; // Approximate width of the selection box
        let left = lastRect.right - contentRect.left - boxWidth;

        // Ensure the box doesn't go beyond the left edge
        if (left < 0) {
          left = Math.min(0, firstRect.left - contentRect.left);
        }

        setSelectionBox({
          top: lastRect.bottom - contentRect.top,
          left: left,
          text: selectedText,
        });
        setIsInputVisible(false);
        setIsSelectionActive(true);
      }
    }
  }, []);

  const handleDocumentMouseDown = useCallback(
    (event: MouseEvent) => {
      if (
        isSelectionActive &&
        selectionBoxRef.current &&
        !selectionBoxRef.current.contains(event.target as Node)
      ) {
        setIsSelectionActive(false);
        setSelectionBox(undefined);
        setIsInputVisible(false);
        setInputValue("");
        setSelectionIndexes(undefined);
      }
    },
    [isSelectionActive]
  );

  const handleSelectionBoxMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleSubmit = async () => {
    if (!selectionIndexes) {
      toast({
        title: "Selection error",
        description:
          "Failed to get start/end indexes of the selected text. Please try again.",
        duration: 5000,
      });
      return;
    }

    if (selectionBox && props.artifact) {
      const humanMessage = new HumanMessage({
        content: inputValue,
        id: uuidv4(),
      });

      props.setMessages((prevMessages) => [...prevMessages, humanMessage]);

      setIsInputVisible(false);
      setInputValue("");
      setSelectionBox(undefined);
      setSelectionIndexes(undefined);

      await props.streamMessage({
        messages: [convertToOpenAIFormat(humanMessage)],
        highlighted: {
          id: props.artifact.id,
          startCharIndex: selectionIndexes.start,
          endCharIndex: selectionIndexes.end,
        },
      });
    }
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [handleMouseUp, handleDocumentMouseDown]);

  useEffect(() => {
    if (markdownRef.current && highlightLayerRef.current) {
      const content = markdownRef.current;
      const highlightLayer = highlightLayerRef.current;

      // Clear existing highlights
      highlightLayer.innerHTML = "";

      if (isSelectionActive && selectionBox) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          if (content.contains(range.commonAncestorContainer)) {
            const rects = range.getClientRects();
            const layerRect = highlightLayer.getBoundingClientRect();

            // Calculate start and end indexes
            let startIndex, endIndex;

            if (props.artifact?.type === "code" && editorRef.current) {
              const from = editorRef.current.posAtDOM(
                range.startContainer,
                range.startOffset
              );
              const to = editorRef.current.posAtDOM(
                range.endContainer,
                range.endOffset
              );
              startIndex = from;
              endIndex = to;
            } else {
              // Calculate start and end indexes
              const startContainer = range.startContainer;
              const endContainer = range.endContainer;
              startIndex = range.startOffset;
              endIndex = range.endOffset;

              // Traverse up to find the common ancestor
              let node: Node | null = startContainer;
              while (node && node !== content) {
                if (node.previousSibling) {
                  node = node.previousSibling;
                  startIndex += node.textContent
                    ? newlineToCarriageReturn(node.textContent)?.length
                    : 0;
                } else {
                  node = node.parentNode;
                }
              }

              node = endContainer;
              while (node && node !== content) {
                if (node.previousSibling) {
                  node = node.previousSibling;
                  endIndex += node.textContent
                    ? newlineToCarriageReturn(node.textContent)?.length
                    : 0;
                } else {
                  node = node.parentNode;
                }
              }
            }

            setSelectionIndexes({ start: startIndex, end: endIndex });

            for (let i = 0; i < rects.length; i++) {
              const rect = rects[i];
              const highlightEl = document.createElement("div");
              highlightEl.className =
                "absolute bg-[#3597934d] pointer-events-none";

              // Adjust the positioning and size
              const verticalPadding = 3;
              highlightEl.style.left = `${rect.left - layerRect.left}px`;
              highlightEl.style.top = `${rect.top - layerRect.top - verticalPadding}px`;
              highlightEl.style.width = `${rect.width}px`;
              highlightEl.style.height = `${rect.height + verticalPadding * 2}px`;

              highlightLayer.appendChild(highlightEl);
            }
          }
        }
      }
    }
  }, [isSelectionActive, selectionBox, props.artifact?.type]);

  if (!props.artifact) {
    return <div className="w-full h-full"></div>;
  }

  return (
    <div className="relative w-full h-full overflow-auto">
      <div className="flex flex-row items-center justify-between">
        <div className="pl-[6px] pt-3 flex flex-row gap-2 items-center justify-start">
          <TooltipIconButton
            tooltip="Close canvas"
            variant="ghost"
            className="w-fit h-fit p-2"
            delayDuration={400}
            onClick={() => props.setSelectedArtifactById(undefined)}
          >
            <X className="w-6 h-6 text-gray-600" />
          </TooltipIconButton>
          <h1 className="text-xl font-medium text-gray-600">
            {props.artifact.title}
          </h1>
        </div>
        <div className="ml-auto mt-[10px] mr-[6px]">
          <ReflectionsDialog
            handleGetReflections={props.handleGetReflections}
            isLoadingReflections={props.isLoadingReflections}
            reflections={props.reflections}
            handleDeleteReflections={props.handleDeleteReflections}
          />
        </div>
        {props.artifact.type === "text" ? (
          <div className="pr-4 pt-3 flex flex-row gap-4 items-center justify-end">
            <TooltipIconButton
              tooltip={props.isEditing ? "Preview" : "Edit"}
              variant="ghost"
              className="transition-colors w-fit h-fit p-2"
              delayDuration={400}
              onClick={() => props.setIsEditing((v) => !v)}
            >
              {props.isEditing ? (
                <Eye className="w-6 h-6 text-gray-600" />
              ) : (
                <PencilLine className="w-6 h-6 text-gray-600" />
              )}
            </TooltipIconButton>
          </div>
        ) : null}
      </div>
      <div
        ref={contentRef}
        className={cn(
          "flex justify-center h-full",
          props.artifact.type === "code" ? "pt-[10px]" : ""
        )}
      >
        <div
          className={cn(
            "relative min-h-full",
            props.artifact.type === "code" ? "min-w-full" : "min-w-full"
          )}
        >
          <div className="h-[85%]" ref={markdownRef}>
            {props.artifact.type === "text" ? (
              <TextRenderer
                isEditing={props.isEditing}
                setIsEditing={props.setIsEditing}
                artifact={props.artifact}
                setArtifactContent={props.setArtifactContent}
              />
            ) : null}
            {props.artifact.type === "code" ? (
              <CodeRenderer
                setArtifactContent={props.setArtifactContent}
                editorRef={editorRef}
                artifact={props.artifact}
              />
            ) : null}
          </div>
          <div
            ref={highlightLayerRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>
        {selectionBox && isSelectionActive && (
          <div
            ref={selectionBoxRef}
            className={cn(
              "absolute bg-white border border-gray-200 shadow-md p-2 flex gap-2",
              isInputVisible ? "rounded-3xl" : "rounded-md"
            )}
            style={{
              top: `${selectionBox.top + 60}px`,
              left: `${selectionBox.left}px`,
              width: isInputVisible ? "400px" : "250px",
              marginLeft: isInputVisible ? "0" : "150px",
            }}
            onMouseDown={handleSelectionBoxMouseDown}
          >
            {isInputVisible ? (
              <form className="relative w-full overflow-hidden flex flex-row items-center gap-1">
                <Input
                  className="w-full transition-all duration-300 focus:ring-0 ease-in-out p-1 focus:outline-none border-0 focus-visible:ring-0"
                  placeholder="Ask Open Canvas..."
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button
                  onClick={handleSubmit}
                  type="submit"
                  variant="ghost"
                  size="icon"
                >
                  <CircleArrowUp
                    className="cursor-pointer"
                    fill="black"
                    stroke="white"
                    size={30}
                  />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsInputVisible(true)}
                className="transition-all duration-300 ease-in-out w-full"
              >
                Ask Open Canvas
              </Button>
            )}
          </div>
        )}
      </div>
      {props.artifact.type === "text" ? (
        <ActionsToolbar
          selectedArtifactId={props.artifact.id}
          streamMessage={props.streamMessage}
        />
      ) : null}
      {props.artifact.type === "code" ? (
        <CodeToolBar
          language={props.artifact.language as ProgrammingLanguageOptions}
          selectedArtifactId={props.artifact.id}
          streamMessage={props.streamMessage}
        />
      ) : null}
    </div>
  );
}
