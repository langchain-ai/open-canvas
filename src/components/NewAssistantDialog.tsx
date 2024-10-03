import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { PlusCircleIcon, Loader } from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { type Assistant } from "@langchain/langgraph-sdk";

export interface NewAssistantDialogProps {
  createAssistant: (
    graphId: string,
    userId: string,
    extra?: {
      assistantName?: string;
      assistantDescription?: string;
      overrideExisting?: boolean;
    }
  ) => Promise<Assistant | undefined>;
  userId: string | undefined;
}

export function NewAssistantDialog(props: NewAssistantDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateNewAssistant = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!props.userId) {
      throw new Error("User ID is required");
    }
    setIsLoading(true);
    await props.createAssistant(
      process.env.NEXT_PUBLIC_LANGGRAPH_GRAPH_ID ?? "",
      props.userId,
      {
        assistantName: name,
        assistantDescription: description,
        overrideExisting: true,
      }
    );
    // Force page reload
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <p
          className="flex items-center font-normal"
          onClick={() => setOpen(true)}
        >
          Create assistant
          <PlusCircleIcon className="ml-2 h-4 w-4" />
        </p>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-8 bg-white rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-light text-gray-800 mb-6">
            Create a new assistant
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateNewAssistant} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tweet writer"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-xs text-gray-500">(optional)</span>
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="For writing tweets about..."
              className="w-full"
            />
          </div>
          <div className="mt-6 flex justify-end">
            {isLoading ? (
              <p className="flex items-center text-gray-600">
                Loading
                <Loader className="ml-2 h-4 w-4 animate-spin" />
              </p>
            ) : (
              <Button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded shadow transition"
              >
                Create
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
