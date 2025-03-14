import {
  isToday,
  isYesterday,
  isWithinInterval,
  subDays,
  format,
} from "date-fns";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import { Thread } from "@langchain/langgraph-sdk";
import { PiChatsCircleLight } from "react-icons/pi";
import { TighterText } from "../ui/header";
import { useGraphContext } from "@/contexts/GraphContext";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { useUserContext } from "@/contexts/UserContext";
import { useThreadContext } from "@/contexts/ThreadProvider";
import { MessageCircle } from "lucide-react";

interface ThreadHistoryProps {
  switchSelectedThreadCallback: (thread: Thread) => void;
}

interface ThreadProps {
  id: string;
  onClick: () => void;
  onDelete: () => void;
  label: string;
  createdAt: Date;
}

const ThreadItem = (props: ThreadProps) => {
  return (
    <div className="flex flex-row gap-2 items-center justify-start w-full group relative border border-transparent hover:border-gray-200 rounded-lg transition-all duration-200 p-2 my-1">
      <div className="relative">
        <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
      </div>
      <Button
        className="px-3 py-1.5 justify-start items-center flex-grow min-w-[191px] pr-0 hover:bg-transparent transition-all duration-200 rounded-md relative group"
        size="sm"
        variant="ghost"
        onClick={props.onClick}
      >
        <div className="flex flex-col w-full">
          <TighterText className="truncate text-sm font-normal w-full text-left text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
            {props.label}
          </TighterText>
          <TighterText className="text-xs text-gray-400 mt-0.5 text-left">
            {format(props.createdAt, "MMM d, h:mm a")}
          </TighterText>
        </div>
      </Button>
      <TooltipIconButton
        tooltip="Delete thread"
        variant="ghost"
        onClick={props.onDelete}
        className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
      >
        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors duration-200" />
      </TooltipIconButton>
    </div>
  );
};

const LoadingThread = () => (
  <div className="flex items-center gap-2 w-full px-3 py-2">
    <Skeleton className="w-4 h-4 rounded-full" />
    <div className="flex flex-col gap-1 flex-grow">
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-3" />
    </div>
  </div>
);

const convertThreadActualToThreadProps = (
  thread: Thread,
  switchSelectedThreadCallback: (thread: Thread) => void,
  deleteThread: (id: string) => void
): ThreadProps => ({
  id: thread.thread_id,
  label:
    thread.metadata?.thread_title ??
    ((thread.values as Record<string, any>)?.messages?.[0]?.content ||
      "Untitled"),
  createdAt: new Date(thread.created_at),
  onClick: () => {
    return switchSelectedThreadCallback(thread);
  },
  onDelete: () => {
    return deleteThread(thread.thread_id);
  },
});

const groupThreads = (
  threads: Thread[],
  switchSelectedThreadCallback: (thread: Thread) => void,
  deleteThread: (id: string) => void
) => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const sevenDaysAgo = subDays(today, 7);

  return {
    today: threads
      .filter((thread) => isToday(new Date(thread.created_at)))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
    yesterday: threads
      .filter((thread) => isYesterday(new Date(thread.created_at)))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
    lastSevenDays: threads
      .filter((thread) =>
        isWithinInterval(new Date(thread.created_at), {
          start: sevenDaysAgo,
          end: yesterday,
        })
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
    older: threads
      .filter((thread) => new Date(thread.created_at) < sevenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(
          t,
          switchSelectedThreadCallback,
          deleteThread
        )
      ),
  };
};

const prettifyDateLabel = (group: string): string => {
  switch (group) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "lastSevenDays":
      return "Last 7 days";
    case "older":
      return "Older";
    default:
      return group;
  }
};

interface ThreadsListProps {
  groupedThreads: {
    today: ThreadProps[];
    yesterday: ThreadProps[];
    lastSevenDays: ThreadProps[];
    older: ThreadProps[];
  };
}

function ThreadsList(props: ThreadsListProps) {
  return (
    <div className="flex flex-col pt-3 gap-6">
      {Object.entries(props.groupedThreads).map(([group, threads]) =>
        threads.length > 0 ? (
          <div key={group} className="relative">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-2">
              <TighterText className="text-sm font-medium mb-2 pl-2 text-gray-500 uppercase tracking-wider">
                {prettifyDateLabel(group)}
              </TighterText>
            </div>
            <div className="flex flex-col px-1">
              {threads.map((thread) => (
                <ThreadItem key={thread.id} {...thread} />
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

export function ThreadHistoryComponent(props: ThreadHistoryProps) {
  const { toast } = useToast();
  const {
    graphData: { setMessages, switchSelectedThread },
  } = useGraphContext();
  const { deleteThread, getUserThreads, userThreads, isUserThreadsLoading } =
    useThreadContext();
  const { user } = useUserContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window == "undefined" || userThreads.length || !user) return;

    getUserThreads();
  }, [user]);

  const handleDeleteThread = async (id: string) => {
    if (!user) {
      toast({
        title: "Failed to delete thread",
        description: "User not found",
        duration: 5000,
        variant: "destructive",
      });
      return;
    }

    await deleteThread(id, () => setMessages([]));
  };

  const groupedThreads = groupThreads(
    userThreads,
    (thread) => {
      switchSelectedThread(thread);
      props.switchSelectedThreadCallback(thread);
      setOpen(false);
    },
    handleDeleteThread
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <TooltipIconButton
          tooltip="History"
          variant="ghost"
          className="w-fit h-fit p-2 hover:scale-105 transition-transform duration-200"
        >
          <PiChatsCircleLight
            className="w-6 h-6 text-gray-600"
            strokeWidth={8}
          />
        </TooltipIconButton>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="border-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-white/95 backdrop-blur-sm"
        aria-describedby={undefined}
      >
        <SheetTitle className="border-b pb-4">
          <TighterText className="px-2 text-xl font-medium text-gray-800">
            Chat History
          </TighterText>
        </SheetTitle>

        {isUserThreadsLoading && !userThreads.length ? (
          <div className="flex flex-col gap-1 px-2 pt-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingThread key={`loading-thread-${i}`} />
            ))}
          </div>
        ) : !userThreads.length ? (
          <div className="flex flex-col items-center justify-center py-12 px-3">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              No items found in history.
            </p>
          </div>
        ) : (
          <ThreadsList groupedThreads={groupedThreads} />
        )}
      </SheetContent>
    </Sheet>
  );
}

export const ThreadHistory = React.memo(ThreadHistoryComponent);
