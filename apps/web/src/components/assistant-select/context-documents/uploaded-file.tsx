import PDFIcon from "@/components/icons/svg/PDFIcon.svg";
import TXTIcon from "@/components/icons/svg/TXTIcon.svg";
import MP4Icon from "@/components/icons/svg/MP4Icon.svg";
import MP3Icon from "@/components/icons/svg/MP3Icon.svg";
import { X } from "lucide-react";
import NextImage from "next/image";
import { Button } from "../../ui/button";
import {
  ALLOWED_AUDIO_TYPE_ENDINGS,
  ALLOWED_VIDEO_TYPE_ENDINGS,
} from "@/constants";
import { ContextDocument } from "@opencanvas/shared/types";
import { cn } from "@/lib/utils";

export function UploadedFiles({
  files,
  handleRemoveFile,
  className,
}: {
  files: FileList | ContextDocument[] | undefined;
  handleRemoveFile?: (index: number) => void;
  className?: string;
}) {
  if (!files) return null;

  const filesArr = Array.isArray(files) ? files : Array.from(files);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filesArr.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 border-gray-100 border-[1px]"
        >
          {file.type.includes("pdf") && (
            <NextImage alt="PDF icon" src={PDFIcon} width={24} height={24} />
          )}
          {file.type.startsWith("text/") &&
            !ALLOWED_VIDEO_TYPE_ENDINGS.some((ending) =>
              file.name.endsWith(ending)
            ) &&
            !ALLOWED_AUDIO_TYPE_ENDINGS.some((ending) =>
              file.name.endsWith(ending)
            ) && (
              <NextImage alt="TXT icon" src={TXTIcon} width={24} height={24} />
            )}
          {ALLOWED_VIDEO_TYPE_ENDINGS.some((ending) =>
            file.name.endsWith(ending)
          ) && (
            <NextImage alt="MP4 icon" src={MP4Icon} width={24} height={24} />
          )}
          {ALLOWED_AUDIO_TYPE_ENDINGS.some((ending) =>
            file.name.endsWith(ending)
          ) && (
            <NextImage alt="MP3 icon" src={MP3Icon} width={24} height={24} />
          )}
          <p className="text-sm text-gray-600">{file.name}</p>
          {handleRemoveFile && (
            <Button
              size="sm"
              variant="outline"
              className="p-2 rounded-full hover:bg-red-100 hover:text-red-500 hover:border-red-600 transition-colors ease-in-out"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveFile(index);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
