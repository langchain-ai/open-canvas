import { cn } from "@/lib/utils";

export function TighterText({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("tracking-tighter", className)}>{children}</p>;
}
