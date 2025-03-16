import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { motion } from "framer-motion";

export function ArtifactLoading() {
  return (
    <motion.div 
      className="w-[80%] max-w-3xl bg-white rounded-lg shadow-lg p-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-56 h-8" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-16 h-6" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-6",
                ["w-1/4", "w-1/3", "w-2/5", "w-1/2", "w-3/5", "w-2/3", "w-3/4"][
                  Math.floor(Math.random() * 7)
                ]
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
      </div>
    </motion.div>
  );
}
