import { Skeleton } from "./ui/skeleton";

export function CanvasLoading() {
  return (
    <>
      <div className="hidden md:flex flex-col items-center w-full h-screen">
        <div className="flex items-center justify-between w-full pt-4 px-4">
          <div className="flex items-center">
            <Skeleton className="w-[175px] h-7 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-[80px] h-7 rounded-md" />
            <Skeleton className="w-[40px] h-7 rounded-md" />
            <Skeleton className="w-[40px] h-7 rounded-md" />
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center mx-auto mt-32">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-[300px] h-7 rounded-md" />
        </div>
        <div className="flex w-full gap-2 items-center justify-center mt-auto mb-3">
          <Skeleton className="w-[650px] h-12 rounded-md" />
          <Skeleton className="w-[50px] h-12 rounded-md" />
        </div>
      </div>
      <div className="flex md:hidden flex-col items-center w-full h-screen">
        <div className="flex items-center justify-between w-full pt-4 px-4">
          <div className="flex items-center">
            <Skeleton className="w-[125px] h-7 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-[60px] h-7 rounded-md" />
            <Skeleton className="w-[30px] h-7 rounded-md" />
            <Skeleton className="w-[30px] h-7 rounded-md" />
          </div>
        </div>
        <div className="flex flex-col gap-2 items-center mx-auto mt-32">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-[300px] h-7 rounded-md" />
        </div>
        <div className="flex w-full gap-2 items-center justify-center mt-auto mb-3">
          <Skeleton className="w-[70%] h-12 rounded-md" />
          <Skeleton className="w-[10%] h-12 rounded-md" />
        </div>
      </div>
    </>
  );
}
