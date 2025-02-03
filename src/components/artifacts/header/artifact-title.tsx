import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";

interface ArtifactTitleProps {
  title: string;
  isArtifactSaved: boolean;
  artifactUpdateFailed: boolean;
}

export function ArtifactTitle(props: ArtifactTitleProps) {
  return (
    <div className="pl-[6px] pt-3 flex flex-col items-start justify-start ml-[6px] gap-1 max-w-1/2">
      <h1 className="text-xl font-medium text-gray-600 line-clamp-1">
        {props.title}
      </h1>
      <span className="mt-auto">
        {props.isArtifactSaved ? (
          <span className="flex items-center justify-start gap-1 text-gray-400">
            <p className="text-xs font-light">Saved</p>
            <CircleCheck className="w-[10px] h-[10px]" />
          </span>
        ) : !props.artifactUpdateFailed ? (
          <span className="flex items-center justify-start gap-1 text-gray-400">
            <p className="text-xs font-light">Saving</p>
            <LoaderCircle className="animate-spin w-[10px] h-[10px]" />
          </span>
        ) : props.artifactUpdateFailed ? (
          <span className="flex items-center justify-start gap-1 text-red-300">
            <p className="text-xs font-light">Failed to save</p>
            <CircleX className="w-[10px] h-[10px]" />
          </span>
        ) : null}
      </span>
    </div>
  );
}
