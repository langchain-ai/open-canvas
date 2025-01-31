import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path } = body as { path: string };

    if (!path) {
      return NextResponse.json(
        { error: "`path` is required." },
        { status: 400 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase credentials for uploading context documents are missing",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS
    );

    const supabaseFile = await supabase.storage
      .from("documents")
      .download(path);

    if (supabaseFile.error) {
      console.error(supabaseFile.error);
      return NextResponse.json(
        {
          error: `Failed to download context document: ${JSON.stringify(supabaseFile.error, null)}. File path: ${path}`,
        },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // supabaseFile.data is already a Blob, get its type
    const mimeType = supabaseFile.data.type;
    const fileExtension = mimeType.split("/")[1];
    const file = new File([supabaseFile.data], `audio.${fileExtension}`, {
      type: mimeType,
    });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "distil-whisper-large-v3-en",
      language: "en",
      temperature: 0.0,
    });

    // Cleanup by deleting the file from supabase
    await supabase.storage.from("documents").remove([path]);

    return NextResponse.json(
      { success: true, text: transcription.text },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to process feedback request:", error);

    return NextResponse.json(
      { error: "Failed to submit feedback." + error.message },
      { status: 500 }
    );
  }
}
