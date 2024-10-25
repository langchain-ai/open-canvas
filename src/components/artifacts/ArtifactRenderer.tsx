import { useToast } from "@/hooks/use-toast";
import { GraphInput } from "@/hooks/use-graph/useGraph";
import { convertToOpenAIFormat } from "@/lib/convert_messages";
import { cn } from "@/lib/utils";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ArtifactV3,
  ProgrammingLanguageOptions,
  Reflections,
  TextHighlight,
} from "@/types";
import { EditorView } from "@codemirror/view";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  CircleArrowUp,
  Forward,
  Copy,
  LoaderCircle,
  CircleCheck,
} from "lucide-react";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { ReflectionsDialog } from "../reflections-dialog/ReflectionsDialog";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ActionsToolbar, CodeToolBar } from "./actions_toolbar";
import { CodeRenderer } from "./CodeRenderer";
import { TextRenderer } from "./TextRenderer";
import { CustomQuickActions } from "./actions_toolbar/custom";
import { getArtifactContent } from "@/hooks/use-graph/utils";
import { isArtifactCodeContent } from "@/lib/artifact_content_types";

export interface ArtifactRendererProps {
  userId: string;
  assistantId: string | undefined;
  artifact: ArtifactV3 | undefined;
  setArtifact: Dispatch<SetStateAction<ArtifactV3 | undefined>>;
  setArtifactContent: (index: number, content: string) => void;
  streamMessage: (input: GraphInput) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<BaseMessage[]>>;
  setSelectedArtifact: (index: number) => void;
  messages: BaseMessage[];
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingReflections: boolean;
  reflections: (Reflections & { updatedAt: Date }) | undefined;
  handleDeleteReflections: () => Promise<boolean>;
  handleGetReflections: () => Promise<void>;
  selectedBlocks: TextHighlight | undefined;
  setSelectedBlocks: Dispatch<SetStateAction<TextHighlight | undefined>>;
  isStreaming: boolean;
  updateRenderedArtifactRequired: boolean;
  setUpdateRenderedArtifactRequired: Dispatch<SetStateAction<boolean>>;
  isArtifactSaved: boolean;
  firstTokenReceived: boolean;
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

  const handleSubmit = async (
    e:
      | FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();

    const artifactContent = props.artifact
      ? getArtifactContent(props.artifact)
      : undefined;
    if (
      !selectionIndexes &&
      artifactContent &&
      isArtifactCodeContent(artifactContent)
    ) {
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
      setIsSelectionActive(false);

      await props.streamMessage({
        messages: [convertToOpenAIFormat(humanMessage)],
        ...(selectionIndexes && {
          highlightedCode: {
            startCharIndex: selectionIndexes.start,
            endCharIndex: selectionIndexes.end,
          },
        }),
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
    try {
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
              let startIndex = 0;
              let endIndex = 0;
              let currentArtifactContent:
                | ArtifactCodeV3
                | ArtifactMarkdownV3
                | undefined = undefined;
              try {
                currentArtifactContent = props.artifact
                  ? getArtifactContent(props.artifact)
                  : undefined;
              } catch (_) {
                console.error(
                  "[ArtifactRenderer.tsx L229]\n\nERROR NO ARTIFACT CONTENT FOUND\n\n",
                  props.artifact
                );
                // no-op
              }

              if (currentArtifactContent?.type === "code") {
                if (editorRef.current) {
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
                }
                setSelectionIndexes({ start: startIndex, end: endIndex });
              }

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
    } catch (e) {
      console.error("Failed to get artifact selection", e);
    }
  }, [isSelectionActive, selectionBox]);

  useEffect(() => {
    console.log(
      "!!props.selectedBlocks && !isSelectionActive",
      !!props.selectedBlocks,
      isSelectionActive
    );
    if (!!props.selectedBlocks && !isSelectionActive) {
      // Selection is not active but selected blocks are present. Clear them.
      props.setSelectedBlocks(undefined);
    }
  }, [props.selectedBlocks, isSelectionActive]);

  const currentArtifactContent = props.artifact
    ? getArtifactContent(props.artifact)
    : undefined;
  if (!props.artifact || !currentArtifactContent) {
    return <div className="w-full h-full"></div>;
  }

  const isBackwardsDisabled =
    props.artifact.contents.length === 1 ||
    currentArtifactContent.index === 1 ||
    props.isStreaming;
  const isForwardDisabled =
    props.artifact.contents.length === 1 ||
    currentArtifactContent.index === props.artifact.contents.length ||
    props.isStreaming;

  return (
    <div className="relative w-full h-full max-h-screen overflow-auto">
      <div className="flex flex-row items-center justify-between">
        <div className="pl-[6px] pt-3 flex flex-col items-start justify-start ml-[6px] gap-1">
          <h1 className="text-xl font-medium text-gray-600 ">
            {currentArtifactContent.title}
          </h1>
          <span className="mt-auto">
            {props.isArtifactSaved ? (
              <span className="flex items-center justify-start gap-1 text-gray-400">
                <p className="text-xs font-light">Saved</p>
                <CircleCheck className="w-[10px] h-[10px]" />
              </span>
            ) : (
              <span className="flex items-center justify-start gap-1 text-gray-400">
                <p className="text-xs font-light">Saving</p>
                <LoaderCircle className="animate-spin w-[10px] h-[10px]" />
              </span>
            )}
          </span>
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3 text-gray-600">
          <TooltipIconButton
            tooltip="Previous"
            side="left"
            variant="ghost"
            className="transition-colors w-fit h-fit p-2"
            delayDuration={400}
            onClick={() => {
              if (!isBackwardsDisabled) {
                props.setSelectedArtifact(currentArtifactContent.index - 1);
              }
            }}
            disabled={isBackwardsDisabled}
          >
            <Forward
              aria-disabled={isBackwardsDisabled}
              className="w-6 h-6 text-gray-600 scale-x-[-1]"
            />
          </TooltipIconButton>
          <div className="flex items-center justify-center gap-1">
            <p className="text-xs pt-1">
              {currentArtifactContent.index} / {props.artifact.contents.length}
            </p>
          </div>
          <TooltipIconButton
            tooltip="Next"
            variant="ghost"
            side="right"
            className="transition-colors w-fit h-fit p-2"
            delayDuration={400}
            onClick={() => {
              if (!isForwardDisabled) {
                props.setSelectedArtifact(currentArtifactContent.index + 1);
              }
            }}
            disabled={isForwardDisabled}
          >
            <Forward
              aria-disabled={isForwardDisabled}
              className="w-6 h-6 text-gray-600"
            />
          </TooltipIconButton>
        </div>
        <div className="ml-auto mt-[10px] mr-[6px]">
          <ReflectionsDialog
            handleGetReflections={props.handleGetReflections}
            isLoadingReflections={props.isLoadingReflections}
            reflections={props.reflections}
            handleDeleteReflections={props.handleDeleteReflections}
          />
        </div>
        <div className="pr-4 pt-3">
          <TooltipIconButton
            tooltip="Copy"
            variant="ghost"
            className="transition-colors w-fit h-fit p-2"
            delayDuration={400}
            onClick={() => {
              try {
                const text = isArtifactCodeContent(currentArtifactContent)
                  ? currentArtifactContent.code
                  : currentArtifactContent.fullMarkdown;
                navigator.clipboard.writeText(text).then(() => {
                  toast({
                    title: "Copied to clipboard",
                    description: "The canvas content has been copied.",
                    duration: 5000,
                  });
                });
              } catch (_) {
                toast({
                  title: "Copy error",
                  description:
                    "Failed to copy the canvas content. Please try again.",
                  duration: 5000,
                });
              }
            }}
          >
            <Copy className="w-6 h-6 text-gray-600" />
          </TooltipIconButton>
        </div>
      </div>
      <div
        ref={contentRef}
        className={cn(
          "flex justify-center h-full",
          currentArtifactContent.type === "code" ? "pt-[10px]" : ""
        )}
      >
        <div
          className={cn(
            "relative min-h-full",
            currentArtifactContent.type === "code" ? "min-w-full" : "min-w-full"
          )}
        >
          <div className="h-full" ref={markdownRef}>
            {currentArtifactContent.type === "text" ? (
              <TextRenderer
                firstTokenReceived={props.firstTokenReceived}
                isInputVisible={isInputVisible}
                isStreaming={props.isStreaming}
                artifact={props.artifact}
                setArtifact={props.setArtifact}
                setSelectedBlocks={props.setSelectedBlocks}
                isEditing={props.isEditing}
                updateRenderedArtifactRequired={
                  props.updateRenderedArtifactRequired
                }
                setUpdateRenderedArtifactRequired={
                  props.setUpdateRenderedArtifactRequired
                }
              />
            ) : null}
            {currentArtifactContent.type === "code" ? (
              <CodeRenderer
                isStreaming={props.isStreaming}
                firstTokenReceived={props.firstTokenReceived}
                setArtifactContent={props.setArtifactContent}
                editorRef={editorRef}
                artifactContent={currentArtifactContent}
                updateRenderedArtifactRequired={
                  props.updateRenderedArtifactRequired
                }
                setUpdateRenderedArtifactRequired={
                  props.setUpdateRenderedArtifactRequired
                }
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
              <form
                onSubmit={handleSubmit}
                className="relative w-full overflow-hidden flex flex-row items-center gap-1"
              >
                <Input
                  className="w-full transition-all duration-300 focus:ring-0 ease-in-out p-1 focus:outline-none border-0 focus-visible:ring-0"
                  placeholder="Ask Open Canvas..."
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Button
                  onClick={(e) => handleSubmit(e)}
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
      <CustomQuickActions
        isTextSelected={isSelectionActive || props.selectedBlocks !== undefined}
        userId={props.userId}
        assistantId={props.assistantId}
        streamMessage={props.streamMessage}
      />
      {currentArtifactContent.type === "text" ? (
        <ActionsToolbar
          isTextSelected={
            isSelectionActive || props.selectedBlocks !== undefined
          }
          streamMessage={props.streamMessage}
        />
      ) : null}
      {currentArtifactContent.type === "code" ? (
        <CodeToolBar
          isTextSelected={
            isSelectionActive || props.selectedBlocks !== undefined
          }
          language={
            currentArtifactContent.language as ProgrammingLanguageOptions
          }
          streamMessage={props.streamMessage}
        />
      ) : null}
    </div>
  );
}
