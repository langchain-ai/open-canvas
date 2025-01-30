import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, mimeType } = body as { data: string; mimeType: string };

    if (!data) {
      return NextResponse.json(
        { error: "`data` is required." },
        { status: 400 }
      );
    }

    if (!mimeType) {
      return NextResponse.json(
        { error: "`mimeType` is required." },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Convert base64 to Buffer if the data is base64 encoded
    const buffer = Buffer.from(data.split(",")[1], "base64");

    // Get file extension from mimeType (e.g., 'audio/mp3' -> 'mp3', 'audio/wav' -> 'wav')
    const fileExtension = mimeType.split("/")[1];

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: mimeType });

    // Create a File object from the Blob with the correct extension
    const file = new File([blob], `audio.${fileExtension}`, { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "distil-whisper-large-v3-en",
      language: "en",
      temperature: 0.0,
    });

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
