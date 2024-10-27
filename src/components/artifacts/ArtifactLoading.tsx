import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export function ArtifactLoading() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between m-4">
        <Skeleton className="w-56 h-10" />
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-16 h-6" />
          <Skeleton className="w-6 h-6" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="w-10 h-10 rounded-md" />
          <Skeleton className="w-10 h-10 rounded-md" />
        </div>
      </div>
      <div className="flex flex-col gap-1 m-4">
        {Array.from({ length: 25 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-5",
              ["w-1/4", "w-1/3", "w-2/5", "w-1/2", "w-3/5", "w-2/3", "w-3/4"][
                Math.floor(Math.random() * 7)
              ]
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-auto m-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    </div>
  );
}
