"use client";

import {
  ContextDocument,
  CreateCustomAssistantArgs,
  EditCustomAssistantArgs,
  fileToBase64,
} from "@/hooks/useAssistants";
import { Assistant } from "@langchain/langgraph-sdk";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Icons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { TighterText } from "../ui/header";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { IconSelect } from "./icon-select";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { ColorPicker } from "./color-picker";
import { Textarea } from "../ui/textarea";
import { InlineContextTooltip } from "../ui/inline-context-tooltip";
import { UploadedFiles } from "./uploaded-file";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { ALLOWED_AUDIO_TYPES, ALLOWED_VIDEO_TYPES } from "@/constants";

function arrayToFileList(files: File[] | undefined) {
  if (!files || !files.length) return undefined;
  const dt = new DataTransfer();
  files?.forEach((file) => dt.items.add(file));
  return dt.files;
}

function contextDocumentToFile(document: ContextDocument): File {
  // Remove any data URL prefix if it exists
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
    console.error("Error converting base64 to file:", error);
    throw error;
  }
}

async function transcribeAudio(file: File) {
  const result = await fetch("/api/whisper/audio", {
    method: "POST",
    body: JSON.stringify({
      data: await fileToBase64(file),
      mimeType: file.type,
    }),
  });
  if (!result.ok) {
    throw new Error("Failed to transcribe audio");
  }
  const data = await result.json();
  return data.text;
}

interface CreateEditAssistantDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  userId: string | undefined;
  isEditing: boolean;
  assistant?: Assistant;
  createCustomAssistant: ({
    newAssistant,
    userId,
    successCallback,
  }: CreateCustomAssistantArgs) => Promise<boolean>;
  editCustomAssistant: ({
    editedAssistant,
    assistantId,
    userId,
  }: EditCustomAssistantArgs) => Promise<Assistant | undefined>;
  isLoading: boolean;
  allDisabled: boolean;
  setAllDisabled: Dispatch<SetStateAction<boolean>>;
}

const GH_DISCUSSION_URL = `https://github.com/langchain-ai/open-canvas/discussions/182`;

const SystemPromptWhatsThis = (): React.ReactNode => (
  <span className="flex flex-col gap-1 text-sm text-gray-600">
    <p>
      Custom system prompts will be passed to the LLM when generating, or
      re-writing artifacts. They are <i>not</i> used for responding to general
      queries in the chat, highlight to edit, or quick actions.
    </p>
    <p>
      We&apos;re looking for feedback on how to best handle customizing
      assistant prompts. To vote, and give feedback please visit{" "}
      <a href={GH_DISCUSSION_URL} target="_blank">
        this GitHub discussion
      </a>
      .
    </p>
  </span>
);

const ContextDocumentsWhatsThis = (): React.ReactNode => (
  <span className="flex flex-col gap-1 text-sm text-gray-600">
    <p className="text-sm text-gray-600">
      Context documents are text or PDF files which will be included in the
      LLM&apos;s context for ALL interactions <i>except</i> quick actions, when
      generating, re-writing and editing artifacts.
    </p>
  </span>
);

export function CreateEditAssistantDialog(
  props: CreateEditAssistantDialogProps
) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [iconName, setIconName] = useState<keyof typeof Icons>("User");
  const [hasSelectedIcon, setHasSelectedIcon] = useState(false);
  const [iconColor, setIconColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [documents, setDocuments] = useState<FileList>();

  const messageRef = useRef<HTMLDivElement>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
  };

  const convertToAudio = async (videoFile: File): Promise<File> => {
    try {
      const ffmpeg = ffmpegRef.current;

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
  };

  const metadata = props.assistant?.metadata as Record<string, any> | undefined;

  useEffect(() => {
    if ((props.assistant, props.isEditing)) {
      setName(props.assistant?.name || "");
      setDescription(metadata?.description || "");
      setSystemPrompt(
        (props.assistant?.config?.configurable?.systemPrompt as
          | string
          | undefined) || ""
      );
      setHasSelectedIcon(true);
      setIconName(metadata?.iconData?.iconName || "User");
      setIconColor(metadata?.iconData?.iconColor || "#000000");
      const documents = props.assistant?.config?.configurable?.documents as
        | ContextDocument[]
        | undefined;
      if (documents && documents.length > 0) {
        const files = documents.map(contextDocumentToFile);
        setDocuments(arrayToFileList(files));
      }
    } else if (!props.isEditing) {
      setName("");
      setDescription("");
      setSystemPrompt("");
      setIconName("User");
      setIconColor("#000000");
      setDocuments(undefined);
    }
  }, [props.assistant, props.isEditing]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!props.userId) {
      toast({
        title: "User not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    if (props.isEditing && !props.assistant) {
      toast({
        title: "Assistant not found",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    props.setAllDisabled(true);

    const contentDocuments: ContextDocument[] = [];
    if (documents?.length) {
      const documentsPromise = Array.from(documents).map(async (doc) => {
        const isAudio = ALLOWED_AUDIO_TYPES.has(doc.type);
        const isVideo = ALLOWED_VIDEO_TYPES.has(doc.type);

        if (isAudio) {
          toast({
            title: "Transcribing audio",
            description: (
              <span className="flex items-center gap-2">
                Transcribing audio {doc.name}. Please wait{" "}
                <Icons.LoaderCircle className="animate-spin w-4 h-4" />
              </span>
            ),
          });

          const transcription = await transcribeAudio(doc);

          toast({
            title: "Successfully transcribed audio",
            description: `Transcribed audio ${doc.name}.`,
          });

          return {
            name: doc.name,
            type: "text",
            data: Buffer.from(transcription).toString("base64"),
          };
        }

        if (isVideo) {
          toast({
            title: "Transcribing video",
            description: (
              <span className="flex items-center gap-2">
                Transcribing video {doc.name}. Please wait{" "}
                <Icons.LoaderCircle className="animate-spin w-4 h-4" />
              </span>
            ),
          });

          // Load FFmpeg
          await load();
          // Convert video to audio
          const audioFile = await convertToAudio(doc);
          // Transcribe audio to video
          const transcription = await transcribeAudio(audioFile);

          toast({
            title: "Successfully transcribed video",
            description: `Transcribed video ${doc.name}.`,
          });

          return {
            name: doc.name,
            type: "text",
            data: Buffer.from(transcription).toString("base64"),
          };
        }

        return {
          name: doc.name,
          type: doc.type,
          data: await fileToBase64(doc),
        };
      });
      contentDocuments.push(...(await Promise.all(documentsPromise)));
    }

    let res: boolean;
    if (props.isEditing && props.assistant) {
      res = !!(await props.editCustomAssistant({
        editedAssistant: {
          name,
          description,
          systemPrompt,
          iconData: {
            iconName,
            iconColor,
          },
          documents: contentDocuments,
        },
        assistantId: props.assistant.assistant_id,
        userId: props.userId,
      }));
    } else {
      res = await props.createCustomAssistant({
        newAssistant: {
          name,
          description,
          systemPrompt,
          iconData: {
            iconName,
            iconColor,
          },
          documents: contentDocuments,
        },
        userId: props.userId,
      });
    }

    if (res) {
      toast({
        title: `Assistant ${props.isEditing ? "edited" : "created"} successfully`,
        duration: 5000,
      });
    } else {
      toast({
        title: `Failed to ${props.isEditing ? "edit" : "create"} assistant`,
        variant: "destructive",
        duration: 5000,
      });
    }
    props.setAllDisabled(false);
    props.setOpen(false);
  };

  const handleResetState = () => {
    setName("");
    setDescription("");
    setSystemPrompt("");
    setIconName("User");
    setIconColor("#000000");
  };

  const handleRemoveFile = (index: number) => {
    setDocuments((prev) => {
      if (!prev) return prev;
      const files = Array.from(prev);
      const newFiles = files.filter((_, i) => i !== index);
      return arrayToFileList(newFiles);
    });
  };

  if (props.isEditing && !props.assistant) {
    return null;
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(change) => {
        if (!change) {
          handleResetState();
        }
        props.setOpen(change);
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] p-8 bg-white rounded-lg shadow-xl min-w-[70vw] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <DialogHeader>
          <DialogTitle className="text-3xl font-light text-gray-800">
            <TighterText>
              {props.isEditing ? "Edit" : "Create"} Assistant
            </TighterText>
          </DialogTitle>
          <DialogDescription className="mt-2 text-md font-light text-gray-600">
            <TighterText>
              Creating a new assistant allows you to tailor your reflections to
              a specific context, as reflections are unique to assistants.
            </TighterText>
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="flex flex-col items-start justify-start gap-4 w-full"
        >
          <Label htmlFor="name">
            <TighterText>
              Name <span className="text-red-500">*</span>
            </TighterText>
          </Label>
          <Input
            disabled={props.allDisabled}
            required
            id="name"
            placeholder="Work Emails"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Label htmlFor="description">
            <TighterText>Description</TighterText>
          </Label>
          <Input
            disabled={props.allDisabled}
            required={false}
            id="description"
            placeholder="Assistant for my work emails"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Label htmlFor="system-prompt">
            <TighterText className="flex items-center">
              System Prompt
              <InlineContextTooltip cardContentClassName="w-[500px] ml-10">
                <SystemPromptWhatsThis />
              </InlineContextTooltip>
            </TighterText>
          </Label>
          <Textarea
            disabled={props.allDisabled}
            required={false}
            id="system-prompt"
            placeholder="You are an expert email assistant..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
          />

          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-col gap-4 items-start justify-start w-full">
              <Label htmlFor="icon">
                <TighterText>Icon</TighterText>
              </Label>
              <IconSelect
                allDisabled={props.allDisabled}
                iconColor={iconColor}
                selectedIcon={iconName}
                setSelectedIcon={(i) => {
                  setHasSelectedIcon(true);
                  setIconName(i);
                }}
                hasSelectedIcon={hasSelectedIcon}
              />
            </div>
            <div className="flex flex-col gap-4 items-start justify-start w-full">
              <Label htmlFor="description">
                <TighterText>Color</TighterText>
              </Label>
              <div className="flex gap-1 items-center justify-start w-full">
                <ColorPicker
                  disabled={props.allDisabled}
                  iconColor={iconColor}
                  setIconColor={setIconColor}
                  showColorPicker={showColorPicker}
                  setShowColorPicker={setShowColorPicker}
                  hoverTimer={hoverTimer}
                  setHoverTimer={setHoverTimer}
                />
                <Input
                  disabled={props.allDisabled}
                  required={false}
                  id="description"
                  placeholder="Assistant for my work emails"
                  value={iconColor}
                  onChange={(e) => {
                    if (!e.target.value.startsWith("#")) {
                      setIconColor("#" + e.target.value);
                    } else {
                      setIconColor(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <Label htmlFor="context-documents">
            <TighterText className="flex items-center">
              Context Documents{" "}
              <span className="text-gray-600 text-sm ml-1">
                (Max 20 files - Documents: 10MB each, Audio: 25MB each, Video:
                1GB each)
              </span>
              <InlineContextTooltip cardContentClassName="w-[500px] ml-10">
                <ContextDocumentsWhatsThis />
              </InlineContextTooltip>
            </TighterText>
          </Label>
          {!documents && (
            <Input
              disabled={props.allDisabled}
              required={false}
              id="context-documents"
              type="file"
              multiple
              accept=".txt,.pdf,.doc,.docx,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;

                if (files.length > 20) {
                  alert("You can only upload up to 20 files");
                  e.target.value = "";
                  return;
                }

                // Size limits in bytes
                const tenMbBytes = 10 * 1024 * 1024; // 10MB for documents
                const twentyFiveMbBytes = 25 * 1024 * 1024; // 25MB for audio
                const oneGbBytes = 1024 * 1024 * 1024; // 1GB for video

                for (let i = 0; i < files.length; i += 1) {
                  const file = files[i];
                  const isAudio = ALLOWED_AUDIO_TYPES.has(file.type);
                  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);

                  // Check size limits based on file type
                  if (isAudio && file.size > twentyFiveMbBytes) {
                    alert(
                      `Audio file "${file.name}" exceeds the 25MB size limit`
                    );
                    e.target.value = "";
                    return;
                  } else if (isVideo && file.size > oneGbBytes) {
                    alert(
                      `Video file "${file.name}" exceeds the 1GB size limit`
                    );
                    e.target.value = "";
                    return;
                  } else if (!isAudio && !isVideo && file.size > tenMbBytes) {
                    alert(
                      `Document "${file.name}" exceeds the 10MB size limit`
                    );
                    e.target.value = "";
                    return;
                  }
                }

                setDocuments(files || undefined);
              }}
            />
          )}
          <UploadedFiles
            files={documents}
            handleRemoveFile={handleRemoveFile}
          />
          {documents && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => setDocuments(undefined)}
            >
              Choose Different Files
            </Button>
          )}

          <div className="flex items-center justify-center w-full mt-4 gap-3">
            <Button
              disabled={props.allDisabled}
              className="w-full"
              type="submit"
            >
              <TighterText>Save</TighterText>
            </Button>
            <Button
              disabled={props.allDisabled}
              onClick={() => {
                handleResetState();
                props.setOpen(false);
              }}
              variant="destructive"
              className="w-[20%]"
              type="button"
            >
              <TighterText>Cancel</TighterText>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
