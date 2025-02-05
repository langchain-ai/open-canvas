import { TighterText } from "@/components/ui/header";
import { InlineContextTooltip } from "@/components/ui/inline-context-tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALLOWED_AUDIO_TYPES, ALLOWED_VIDEO_TYPES } from "@/constants";
import { LoaderCircle, Plus, X } from "lucide-react";
import { UploadedFiles } from "./uploaded-file";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ContextDocumentsWhatsThis = (): React.ReactNode => (
  <span className="flex flex-col gap-1 text-sm text-gray-600">
    <p className="text-sm text-gray-600">
      Context documents are text or PDF files which will be included in the
      LLM&apos;s context for ALL interactions <i>except</i> quick actions, when
      generating, re-writing and editing artifacts.
    </p>
  </span>
);

interface ContextDocumentsProps {
  documents: FileList | undefined;
  setDocuments: React.Dispatch<React.SetStateAction<FileList | undefined>>;
  loadingDocuments: boolean;
  allDisabled: boolean;
  handleRemoveFile: (index: number) => void;
  urls: string[];
  setUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

interface UrlInputRowProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  onAdd: () => void;
  isLast: boolean;
  disabled: boolean;
}

function UrlInputRow({
  value,
  onChange,
  onRemove,
  onAdd,
  isLast,
  disabled,
}: UrlInputRowProps) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        type="url"
        placeholder="Enter URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
        disabled={disabled}
      />
      {isLast && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ContextDocuments(props: ContextDocumentsProps) {
  const {
    documents,
    setDocuments,
    loadingDocuments,
    allDisabled,
    handleRemoveFile,
    urls,
    setUrls,
  } = props;

  const [showUrlInputs, setShowUrlInputs] = useState(urls.length > 0);

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleUrlRemove = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    if (newUrls.length === 0) {
      setShowUrlInputs(false);
    }
  };

  const handleUrlAdd = () => {
    setUrls([...urls, ""]);
  };

  return (
    <div className="flex flex-col items-start justify-start gap-4 w-full">
      <Label htmlFor="context-documents">
        <TighterText className="flex items-center">
          Context Documents{" "}
          <span className="text-gray-600 text-sm ml-1">
            (Max 20 files - Documents: 10MB each, Audio: 25MB each, Video: 1GB
            each)
          </span>
          <InlineContextTooltip cardContentClassName="w-[500px] ml-10">
            <ContextDocumentsWhatsThis />
          </InlineContextTooltip>
        </TighterText>
      </Label>
      <Input
        disabled={allDisabled}
        required={false}
        id="context-documents"
        type="file"
        multiple
        accept=".txt,.md,.json,.xml,.css,.html,.csv,.pdf,.doc,.docx,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
        onChange={(e) => {
          const newFiles = e.target.files;
          if (!newFiles) return;

          // Create array from existing files if any
          const existingFiles = documents ? Array.from(documents) : [];
          const totalFileCount = existingFiles.length + newFiles.length;

          if (totalFileCount > 20) {
            alert("You can only upload up to 20 files in total");
            e.target.value = "";
            return;
          }

          // Size limits in bytes
          const tenMbBytes = 10 * 1024 * 1024; // 10MB for documents
          const twentyFiveMbBytes = 25 * 1024 * 1024; // 25MB for audio
          const oneGbBytes = 1024 * 1024 * 1024; // 1GB for video

          for (let i = 0; i < newFiles.length; i += 1) {
            const file = newFiles[i];
            const isAudio = ALLOWED_AUDIO_TYPES.has(file.type);
            const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);

            // Check size limits based on file type
            if (isAudio && file.size > twentyFiveMbBytes) {
              alert(`Audio file "${file.name}" exceeds the 25MB size limit`);
              e.target.value = "";
              return;
            } else if (isVideo && file.size > oneGbBytes) {
              alert(`Video file "${file.name}" exceeds the 1GB size limit`);
              e.target.value = "";
              return;
            } else if (!isAudio && !isVideo && file.size > tenMbBytes) {
              alert(`Document "${file.name}" exceeds the 10MB size limit`);
              e.target.value = "";
              return;
            }
          }

          // Merge existing files with new files
          const mergedFiles = [...existingFiles, ...Array.from(newFiles)];

          // Create a new FileList-like object
          const dataTransfer = new DataTransfer();
          mergedFiles.forEach((file) => dataTransfer.items.add(file));

          setDocuments(dataTransfer.files);
          e.target.value = ""; // Reset input to allow selecting the same file again
        }}
      />
      {loadingDocuments && (
        <span className="text-gray-600 text-sm flex gap-2">
          Loading context documents{" "}
          <LoaderCircle className="animate-spin w-4 h-4" />
        </span>
      )}
      <UploadedFiles files={documents} handleRemoveFile={handleRemoveFile} />

      <div className="w-full flex flex-col gap-2">
        {showUrlInputs || urls.length > 0 ? (
          urls.map((url, index) => (
            <UrlInputRow
              key={index}
              value={url}
              onChange={(value) => handleUrlChange(index, value)}
              onRemove={() => handleUrlRemove(index)}
              onAdd={handleUrlAdd}
              isLast={index === urls.length - 1}
              disabled={allDisabled}
            />
          ))
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowUrlInputs(true);
              handleUrlAdd();
            }}
            disabled={allDisabled}
          >
            Add links
          </Button>
        )}
      </div>
    </div>
  );
}
