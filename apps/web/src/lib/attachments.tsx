import * as Icons from "lucide-react";
import { ALLOWED_VIDEO_TYPES, ALLOWED_AUDIO_TYPES } from "@/constants";
import { useToast } from "@/hooks/use-toast";
import { ContextDocument } from "@opencanvas/shared/types";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { createClient } from "@supabase/supabase-js";

export function arrayToFileList(files: File[] | undefined) {
  if (!files || !files.length) return undefined;
  const dt = new DataTransfer();
  files?.forEach((file) => dt.items.add(file));
  return dt.files;
}

export function contextDocumentToFile(document: ContextDocument): File {
  if (document.type === "text") {
    // For text documents, create file directly from the text data
    const blob = new Blob([document.data], { type: "text/plain" });
    return new File([blob], document.name, { type: "text/plain" });
  }

  // For non-text documents, handle as base64
  let base64String = document.data;
  if (base64String.includes(",")) {
    base64String = base64String.split(",")[1];
  }

  // Fix padding if necessary
  while (base64String.length % 4 !== 0) {
    base64String += "=";
  }

  // Clean the string (remove whitespace and invalid characters)
  base64String = base64String.replace(/\s/g, "");

  try {
    // Convert base64 to binary
    const binaryString = atob(base64String);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create Blob from the bytes
    const blob = new Blob([bytes], { type: document.type });

    // Create File object
    return new File([blob], document.name, { type: document.type });
  } catch (error) {
    console.error("Error converting data to file:", error);
    throw error;
  }
}

export async function transcribeAudio(file: File, userId: string) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS
  ) {
    throw new Error(
      "Supabase credentials for uploading context documents are missing"
    );
  }
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS
  );

  const res = await client.storage
    .from("documents")
    .upload(
      `${userId}/${new Date().getTime()}-${file.name.replaceAll("/", "-").replaceAll(" ", "-")}`,
      file,
      {
        upsert: true,
      }
    );
  if (res.error) {
    throw new Error(`Failed to upload context document: ${res.error.message}`);
  }

  const result = await fetch("/api/whisper/audio", {
    method: "POST",
    body: JSON.stringify({
      path: res.data.path,
    }),
  });
  if (!result.ok) {
    throw new Error("Failed to transcribe audio");
  }
  const data = await result.json();
  return data.text;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(
          `Failed to convert file to base64. Received ${typeof reader.result} result.`
        );
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

const MAX_AUDIO_SIZE = 26214400;

export async function load(
  ffmpeg: FFmpeg,
  messageRef: React.RefObject<HTMLDivElement>
) {
  // Check if FFmpeg is already loaded
  if (ffmpeg.loaded) {
    return;
  }

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
  ffmpeg.on("log", ({ message }) => {
    if (messageRef.current) messageRef.current.innerHTML = message;
  });
  // toBlobURL is used to bypass CORS issue, urls with the same
  // domain can be used directly.
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
}

export async function convertToAudio(
  videoFile: File,
  ffmpeg: FFmpeg
): Promise<File> {
  try {
    // Create a buffer from the video file
    const videoData = await videoFile.arrayBuffer();

    // Write the video buffer to FFmpeg's virtual filesystem
    await ffmpeg.writeFile("input.mp4", new Uint8Array(videoData));

    // Run FFmpeg command to convert video to audio
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-vn",
      "-acodec",
      "libmp3lame",
      "-q:a",
      "2",
      "output.mp3",
    ]);

    // Read the output file from FFmpeg's virtual filesystem
    const audioData = await ffmpeg.readFile("output.mp3");

    // Create a Blob from the audio data
    const audioBlob = new Blob([audioData], { type: "audio/mp3" });

    // Generate a filename for the new audio file
    // You can customize this naming convention
    const originalName = videoFile.name;
    const audioFileName = originalName.replace(/\.[^/.]+$/, "") + ".mp3";

    // Create and return a new File object
    return new File([audioBlob], audioFileName, {
      type: "audio/mp3",
      lastModified: new Date().getTime(),
    });
  } catch (error) {
    console.error("Error converting video to audio:", error);
    throw error;
  }
}

export interface ConvertDocumentsProps {
  ffmpeg: FFmpeg;
  messageRef: React.RefObject<HTMLDivElement>;
  documents: FileList;
  userId: string;
  toast: ReturnType<typeof useToast>["toast"];
}

export async function convertDocuments({
  ffmpeg,
  messageRef,
  documents,
  userId,
  toast,
}: ConvertDocumentsProps): Promise<ContextDocument[]> {
  const files = Array.from(documents);
  const includesVideoFile = files.some((file) =>
    ALLOWED_VIDEO_TYPES.has(file.type)
  );
  if (includesVideoFile) {
    // Load FFmpeg
    await load(ffmpeg, messageRef);
  }

  const documentsPromise = Array.from(documents).map(async (doc) => {
    const isAudio = ALLOWED_AUDIO_TYPES.has(doc.type);
    const isVideo = ALLOWED_VIDEO_TYPES.has(doc.type);

    if (isAudio) {
      if (doc.size > MAX_AUDIO_SIZE) {
        toast({
          title: "Failed to transcribe audio",
          description: `Audio file "${doc.name}" is larger than the max size of 26214400 bytes. Received ${doc.size} bytes.`,
          variant: "destructive",
          duration: 7500,
        });
        return null;
      }

      toast({
        title: "Transcribing audio",
        description: (
          <span className="flex items-center gap-2">
            Transcribing audio {doc.name}. This may take a while. Please wait{" "}
            <Icons.LoaderCircle className="animate-spin w-4 h-4" />
          </span>
        ),
        duration: 15000,
      });

      const transcription = await transcribeAudio(doc, userId);

      toast({
        title: "Successfully transcribed audio",
        description: `Transcribed audio ${doc.name}.`,
      });

      return {
        name: doc.name,
        type: "text",
        data: transcription,
      };
    }

    if (isVideo) {
      toast({
        title: "Converting video to audio",
        description: (
          <span className="flex items-center gap-2">
            Converting video {doc.name} to audio. This may take a while. Please
            wait <Icons.LoaderCircle className="animate-spin w-4 h-4" />
          </span>
        ),
        duration: 15000,
      });

      // Convert video to audio
      const audioFile = await convertToAudio(doc, ffmpeg);

      if (audioFile.size > MAX_AUDIO_SIZE) {
        toast({
          title: "Failed to transcribe video",
          description: `Audio for video "${doc.name}" is larger than the max size of 26214400 bytes. Received ${audioFile.size} bytes.`,
          variant: "destructive",
          duration: 7500,
        });
        return null;
      }

      toast({
        title: "Successfully converted video to audio",
        description: (
          <span className="flex items-center gap-2">
            Video to audio conversion completed for {doc.name}. Transcribing
            audio now. This may take a while. Please wait{" "}
            <Icons.LoaderCircle className="animate-spin w-4 h-4" />
          </span>
        ),
        duration: 60000,
      });
      // Transcribe audio to video
      const transcription = await transcribeAudio(audioFile, userId);

      toast({
        title: "Successfully transcribed video",
        description: `Transcribed video ${doc.name}.`,
      });

      return {
        name: doc.name,
        type: "text",
        data: transcription,
      };
    }

    return {
      name: doc.name,
      type: doc.type,
      data: await fileToBase64(doc),
    };
  });
  const documentsResult = (await Promise.all(documentsPromise)).filter(
    (x) => x !== null
  );
  return documentsResult;
}
