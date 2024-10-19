import { isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { TooltipIconButton } from "./ui/assistant-ui/tooltip-icon-button";
import { Button } from "./ui/button";
import { History, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";
import { Thread } from "@langchain/langgraph-sdk";

interface ThreadHistoryProps {
  isUserThreadsLoading: boolean;
  userThreads: Thread[];
  switchSelectedThread: (thread: Thread) => void;
  deleteThread: (id: string) => Promise<void>;
}

interface ThreadProps {
  id: string;
  onClick: () => void;
  onDelete: () => void;
  label: string;
  createdAt: Date;
}

const ThreadItem = (props: ThreadProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="flex flex-row gap-0 items-center justify-start w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button
        className="px-2 justify-start items-center flex-grow min-w-[191px] pr-0"
        size="sm"
        variant="ghost"
        onClick={props.onClick}
      >
        <p className="truncate text-sm font-light w-full text-left">
          {props.label}
        </p>
      </Button>
      {isHovering && (
        <TooltipIconButton
          tooltip="Delete thread"
          variant="ghost"
          onClick={props.onDelete}
        >
          <Trash2 className="w-12 h-12 text-[#575757] hover:text-red-500 transition-colors ease-in" />
        </TooltipIconButton>
      )}
    </div>
  );
};

const LoadingThread = () => <Skeleton className="w-full h-8" />;

const convertThreadActualToThreadProps = (
  thread: Thread,
  switchSelectedThread: (thread: Thread) => void,
  deleteThread: (id: string) => void
): ThreadProps => ({
  id: thread.thread_id,
  label:
    (thread.values as Record<string, any>)?.messages?.[0].content || "Untitled",
  createdAt: new Date(thread.created_at),
  onClick: () => {
    return switchSelectedThread(thread);
  },
  onDelete: () => {
    return deleteThread(thread.thread_id);
  },
});

const groupThreads = (
  threads: Thread[],
  switchSelectedThread: (thread: Thread) => void,
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
        convertThreadActualToThreadProps(t, switchSelectedThread, deleteThread)
      ),
    yesterday: threads
      .filter((thread) => isYesterday(new Date(thread.created_at)))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(t, switchSelectedThread, deleteThread)
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
        convertThreadActualToThreadProps(t, switchSelectedThread, deleteThread)
      ),
    older: threads
      .filter((thread) => new Date(thread.created_at) < sevenDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((t) =>
        convertThreadActualToThreadProps(t, switchSelectedThread, deleteThread)
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
    <div className="flex flex-col pt-3 gap-4">
      {Object.entries(props.groupedThreads).map(([group, threads]) =>
        threads.length > 0 ? (
          <div key={group}>
            <h3 className="text-sm font-medium mb-1 pl-2">
              {prettifyDateLabel(group)}
            </h3>
            <div className="flex flex-col gap-1">
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

export function ThreadHistory(props: ThreadHistoryProps) {
  const [open, setOpen] = useState(false);
  const groupedThreads = groupThreads(
    props.userThreads,
    (thread) => {
      props.switchSelectedThread(thread);
      setOpen(false);
    },
    props.deleteThread
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <TooltipIconButton
          tooltip="New chat"
          variant="ghost"
          className="w-fit h-fit p-2"
        >
          <History className="w-6 h-6 text-gray-600" />
        </TooltipIconButton>
      </SheetTrigger>
      <SheetContent side="left" className="border-none">
        <p className="px-2 text-lg text-gray-600">Chat History</p>
        {props.isUserThreadsLoading && !props.userThreads.length ? (
          <div className="flex flex-col gap-1 px-2 pt-3">
            {Array.from({ length: 25 }).map((_, i) => (
              <LoadingThread key={`loading-thread-${i}`} />
            ))}
          </div>
        ) : !props.userThreads.length ? (
          <p className="px-3 text-gray-500">No items found in history.</p>
        ) : (
          <ThreadsList groupedThreads={groupedThreads} />
        )}
      </SheetContent>
    </Sheet>
  );
}
