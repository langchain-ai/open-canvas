import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { arrayToFileList, convertDocuments, load } from "@/lib/attachments";
import { useToast } from "./use-toast";
import { ContextDocument } from "@opencanvas/shared/types";

export function useContextDocuments(userId: string) {
  const { toast } = useToast();
  const [processedContextDocuments, setProcessedContextDocuments] = useState<
    Map<string, ContextDocument>
  >(new Map());
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

    const files = documents?.length ? Array.from(documents) : [];
    const currentFileNames = new Set(files.map((f) => f.name));
    const currentUrls = new Set(urls);

    // Remove deleted entries from processedContextDocuments
    for (const key of Array.from(processedContextDocuments.keys())) {
      if (!currentFileNames.has(key) && !currentUrls.has(key)) {
        processedContextDocuments.delete(key);
      }
    }

    // Only process files/urls that haven't been processed before
    const unprocessedFiles = files.filter(
      (f) => !processedContextDocuments.has(f.name)
    );
    const unprocessedFileList = arrayToFileList(unprocessedFiles);

    const unprocessedUrls = urls.filter(
      (url) => !processedContextDocuments.has(url)
    );

    const [fileDocuments, urlDocuments] = await Promise.all([
      unprocessedFileList?.length
        ? convertDocuments({
            ffmpeg: ffmpegRef.current,
            messageRef,
            documents: unprocessedFileList,
            userId: userId,
            toast,
          })
        : [],
      unprocessedUrls.length ? convertUrlsToDocuments(unprocessedUrls) : [],
    ]);

    // Add newly processed documents to the Map
    [...fileDocuments, ...urlDocuments].forEach((doc) => {
      if (doc.metadata?.url) {
        processedContextDocuments.set(doc.metadata.url, doc);
      } else {
        processedContextDocuments.set(doc.name, doc);
      }
    });

    // Return all documents (both newly processed and previously processed)
    return Array.from(processedContextDocuments.values());
  };

  return {
    documents,
    setDocuments,
    urls,
    setUrls,
    loadingDocuments,
    setLoadingDocuments,
    processDocuments,
    setProcessedContextDocuments,
  };
}
