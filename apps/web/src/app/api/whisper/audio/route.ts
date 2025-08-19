import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

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

    // Stubbed response for development purposes
    const transcription = { text: "Stubbed transcription text" };

    return NextResponse.json(
      { success: true, text: transcription.text },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to process request:", error);

    return NextResponse.json(
      { error: "Failed to process request." + error.message },
      { status: 500 }
    );
  }
}
