import { useToast } from "@/hooks/use-toast";
import { GraphInput, GraphConfig } from "@/hooks/use-graph/useGraph";
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
import { Forward, LoaderCircle, CircleCheck } from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { ReflectionsDialog } from "../reflections-dialog/ReflectionsDialog";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { ActionsToolbar, CodeToolBar } from "./actions_toolbar";
import { CodeRenderer } from "./CodeRenderer";
import { TextRenderer } from "./TextRenderer";
import { CustomQuickActions } from "./actions_toolbar/custom";
import { getArtifactContent } from "@/hooks/use-graph/utils";
import { ArtifactLoading } from "./ArtifactLoading";
import { CopyText } from "./components/CopyText";
import { AskOpenCanvas } from "./components/AskOpenCanvas";

export interface ArtifactRendererProps {
  userId: string;
  assistantId: string | undefined;
  artifact: ArtifactV3 | undefined;
  setArtifact: Dispatch<SetStateAction<ArtifactV3 | undefined>>;
  setArtifactContent: (index: number, content: string) => void;
  streamMessage: (input: GraphInput, config?: GraphConfig) => Promise<void>;
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

interface ArtifactTitleProps {
  title: string;
  isArtifactSaved: boolean;
}

function ArtifactTitle(props: ArtifactTitleProps) {
  return (
    <>
      <h1 className="text-xl font-medium text-gray-600 ">{props.title}</h1>
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
    </>
  );
}

interface NavigateArtifactHistoryProps {
  isBackwardsDisabled: boolean;
  isForwardDisabled: boolean;
  setSelectedArtifact: (prevState: number) => void;
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  totalArtifactVersions: number;
}

function NavigateArtifactHistory(props: NavigateArtifactHistoryProps) {
  return (
    <>
      <TooltipIconButton
        tooltip="Previous"
        side="left"
        variant="ghost"
        className="transition-colors w-fit h-fit p-2"
        delayDuration={400}
        onClick={() => {
          if (!props.isBackwardsDisabled) {
            props.setSelectedArtifact(props.currentArtifactContent.index - 1);
          }
        }}
        disabled={props.isBackwardsDisabled}
      >
        <Forward
          aria-disabled={props.isBackwardsDisabled}
          className="w-6 h-6 text-gray-600 scale-x-[-1]"
        />
      </TooltipIconButton>
      <div className="flex items-center justify-center gap-1">
        <p className="text-xs pt-1">
          {props.currentArtifactContent.index} / {props.totalArtifactVersions}
        </p>
      </div>
      <TooltipIconButton
        tooltip="Next"
        variant="ghost"
        side="right"
        className="transition-colors w-fit h-fit p-2"
        delayDuration={400}
        onClick={() => {
          if (!props.isForwardDisabled) {
            props.setSelectedArtifact(props.currentArtifactContent.index + 1);
          }
        }}
        disabled={props.isForwardDisabled}
      >
        <Forward
          aria-disabled={props.isForwardDisabled}
          className="w-6 h-6 text-gray-600"
        />
      </TooltipIconButton>
    </>
  );
}

export function ArtifactRenderer(props: ArtifactRendererProps) {
  const editorRef = useRef<EditorView | null>(null);
  const artifactContentRef = useRef<HTMLDivElement>(null);
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
  const [isHoveringOverArtifact, setIsHoveringOverArtifact] = useState(false);

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

  const handleCleanupState = () => {
    setIsInputVisible(false);
    setSelectionBox(undefined);
    setSelectionIndexes(undefined);
    setIsSelectionActive(false);
    setInputValue("");
  };

  const handleDocumentMouseDown = useCallback(
    (event: MouseEvent) => {
      if (
        isSelectionActive &&
        selectionBoxRef.current &&
        !selectionBoxRef.current.contains(event.target as Node)
      ) {
        handleCleanupState();
      }
    },
    [isSelectionActive]
  );

  const handleSelectionBoxMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handleSubmit = async (content: string) => {
    const humanMessage = new HumanMessage({
      content,
      id: uuidv4(),
    });

    props.setMessages((prevMessages) => [...prevMessages, humanMessage]);
    handleCleanupState();
    await props.streamMessage({
      messages: [convertToOpenAIFormat(humanMessage)],
      ...(selectionIndexes && {
        highlightedCode: {
          startCharIndex: selectionIndexes.start,
          endCharIndex: selectionIndexes.end,
        },
      }),
    });
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
      if (artifactContentRef.current && highlightLayerRef.current) {
        const content = artifactContentRef.current;
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
    if (!!props.selectedBlocks && !isSelectionActive) {
      // Selection is not active but selected blocks are present. Clear them.
      props.setSelectedBlocks(undefined);
    }
  }, [props.selectedBlocks, isSelectionActive]);

  const currentArtifactContent = props.artifact
    ? getArtifactContent(props.artifact)
    : undefined;

  if (!props.artifact && props.isStreaming) {
    return <ArtifactLoading />;
  }

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
          <ArtifactTitle
            title={currentArtifactContent.title}
            isArtifactSaved={props.isArtifactSaved}
          />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3 text-gray-600">
          <NavigateArtifactHistory
            isBackwardsDisabled={isBackwardsDisabled}
            isForwardDisabled={isForwardDisabled}
            setSelectedArtifact={props.setSelectedArtifact}
            currentArtifactContent={currentArtifactContent}
            totalArtifactVersions={props.artifact.contents.length}
          />
        </div>
        <div className="ml-auto mt-[10px] mr-[6px]">
          <ReflectionsDialog
            handleGetReflections={props.handleGetReflections}
            isLoadingReflections={props.isLoadingReflections}
            reflections={props.reflections}
            handleDeleteReflections={props.handleDeleteReflections}
          />
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
          <div
            className="h-full"
            ref={artifactContentRef}
            onMouseEnter={() => setIsHoveringOverArtifact(true)}
            onMouseLeave={() => setIsHoveringOverArtifact(false)}
          >
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
                isHovering={isHoveringOverArtifact}
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
                isHovering={isHoveringOverArtifact}
              />
            ) : null}
          </div>
          <div
            ref={highlightLayerRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>
        {selectionBox && isSelectionActive && (
          <AskOpenCanvas
            ref={selectionBoxRef}
            inputValue={inputValue}
            setInputValue={setInputValue}
            isInputVisible={isInputVisible}
            selectionBox={selectionBox}
            setIsInputVisible={setIsInputVisible}
            handleSubmitMessage={handleSubmit}
            handleSelectionBoxMouseDown={handleSelectionBoxMouseDown}
            artifact={props.artifact}
            selectionIndexes={selectionIndexes}
            handleCleanupState={handleCleanupState}
          />
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
