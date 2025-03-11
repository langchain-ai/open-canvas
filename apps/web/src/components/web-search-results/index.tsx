import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WEB_SEARCH_RESULTS_QUERY_PARAM } from "@/constants";
import { useGraphContext } from "@/contexts/GraphContext";
import { SearchResult } from "@opencanvas/shared/types";
import { TighterText } from "../ui/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TooltipIconButton } from "../assistant-ui/tooltip-icon-button";
import { X } from "lucide-react";
import { format } from "date-fns";
import { LoadingSearchResultCards } from "./loading-cards";
import { useQueryState } from "nuqs";

function SearchResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {result.metadata?.url ? (
            <a
              href={result.metadata.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {result.metadata?.title || "Untitled"}
            </a>
          ) : (
            <>{result.metadata?.title || "Untitled"}</>
          )}
        </CardTitle>
        <CardDescription>
          {result.metadata?.author || "Unknown author"}
          {result.metadata?.publishedDate &&
            ` - ${format(new Date(result.metadata?.publishedDate), "Pp")}`}
        </CardDescription>
      </CardHeader>
      <CardContent
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <AnimatePresence initial={false}>
          <motion.p
            key={expanded ? "expanded" : "collapsed"}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "text-pretty text-sm",
              !expanded ? "line-clamp-3" : ""
            )}
          >
            {result.pageContent}
          </motion.p>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface WebSearchResultsProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function WebSearchResults({ open, setOpen }: WebSearchResultsProps) {
  const [status, setStatus] = useState<"searching" | "done">("searching");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const {
    graphData: { messages },
  } = useGraphContext();
  const [webSearchResultsId, setWebSearchResultsId] = useQueryState(
    WEB_SEARCH_RESULTS_QUERY_PARAM
  );

  useEffect(() => {
    if (!webSearchResultsId && open) {
      setOpen(false);
      setSearchResults([]);
      return;
    }
    if (!webSearchResultsId || !messages.length) {
      return;
    }
    const webResultsMessage =
      messages.find((message) => message.id === webSearchResultsId) ||
      messages.find((message) => message.id?.startsWith("web-search-results-"));
    if (!webResultsMessage) {
      return;
    } else if (
      webResultsMessage.id &&
      webResultsMessage.id !== webSearchResultsId
    ) {
      setWebSearchResultsId(webResultsMessage.id);
    }
    const searchResults = webResultsMessage.additional_kwargs
      ?.webSearchResults as SearchResult[] | undefined;
    const status = (webResultsMessage.additional_kwargs?.webSearchStatus ||
      "searching") as "searching" | "done";

    setOpen(true);
    setSearchResults(searchResults || []);
    setStatus(status);
  }, [webSearchResultsId, messages]);

  const handleClose = () => {
    setOpen(false);
    setSearchResults([]);
    setWebSearchResultsId(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="flex flex-col gap-6 w-full max-w-md p-5 border-l-[1px] border-gray-200 shadow-inner-left h-screen overflow-hidden"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <div className="flex justify-between items-center w-full">
            <TighterText className="text-lg font-medium text-right">
              Search Results
            </TighterText>
            <TooltipIconButton
              tooltip="Close"
              variant="ghost"
              onClick={handleClose}
            >
              <X className="size-4" />
            </TooltipIconButton>
          </div>
          <motion.div
            className="flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {searchResults?.length > 0 &&
              status === "done" &&
              searchResults.map((result, index) => (
                <SearchResultCard
                  key={`${index}-${result.id}`}
                  result={result}
                />
              ))}
            {!searchResults?.length && status === "done" && (
              <p>No results found</p>
            )}
            {status === "searching" && <LoadingSearchResultCards />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
