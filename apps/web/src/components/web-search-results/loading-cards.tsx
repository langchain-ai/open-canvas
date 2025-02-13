import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";

export function LoadingSearchResultCards() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card className="w-full" key={`card-loading-web-search-${i}`}>
          <CardHeader>
            <CardTitle>
              <Skeleton className="w-[85%] h-5" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="w-[70%] h-4" />
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-[90%] h-3" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
