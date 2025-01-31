import { useEffect, useRef, useState } from "react";
import { ContextDocument } from "./useAssistants";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { convertDocuments, load } from "@/lib/attachments";
import { useToast } from "./use-toast";

export function useContextDocuments(userId: string) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<FileList>();
  const [urls, setUrls] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    if (!documents?.length) return;
    if (typeof window === "undefined") return;
    if (ffmpegRef.current.loaded) return;

    // Preemptively load FFmpeg if documents are present
    load(ffmpegRef.current, messageRef);
  }, [documents]);

  const convertUrlsToDocuments = async (
    urls: string[]
  ): Promise<ContextDocument[]> => {
    try {
      const results = await fetch("/api/firecrawl/scrape", {
        method: "POST",
        body: JSON.stringify({ urls }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!results.ok) {
        toast({
          title: "Failed to scrape content",
          description: "Please try again later.",
          variant: "destructive",
          duration: 5000,
        });
        return [];
      }

      const { documents } = await results.json();
      return documents;
    } catch (e) {
      console.error("Failed to convert URLs to documents:", e);
      toast({
        title: "Failed to convert URLs to documents",
        description: "Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
      return [];
    }
  };

  const processDocuments = async () => {
    if (!userId) {
      toast({
        title: "User not found",
        description: "Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
      return [];
    }

    const [fileDocuments, urlDocuments] = await Promise.all([
      documents?.length
        ? convertDocuments({
            ffmpeg: ffmpegRef.current,
            messageRef,
            documents,
            userId: userId,
            toast,
          })
        : [],
      urls.length ? convertUrlsToDocuments(urls) : [],
    ]);

    return [...fileDocuments, ...urlDocuments];
  };

  return {
    documents,
    setDocuments,
    urls,
    setUrls,
    loadingDocuments,
    setLoadingDocuments,
    processDocuments,
  };
}
