import { NextRequest, NextResponse } from "next/server";
import { ContextDocument } from "@opencanvas/shared/types";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { urls } = body as { urls: string[] };

    if (!urls) {
      return NextResponse.json(
        { error: "`urls` is required." },
        { status: 400 }
      );
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        {
          error: "Firecrawl API key is missing",
        },
        { status: 400 }
      );
    }

    const contextDocuments: ContextDocument[] = [];

    for (const url of urls) {
      const loader = new FireCrawlLoader({
        url,
        mode: "scrape",
        params: {
          formats: ["markdown"],
        },
      });

      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const path = urlObj.pathname;
      const cleanedUrl = `${hostname}${path}`;

      const docs = await loader.load();
      const text = docs.map((doc) => doc.pageContent).join("\n");

      contextDocuments.push({
        name: cleanedUrl,
        type: "text",
        data: text,
        metadata: {
          url,
        },
      });
    }

    return NextResponse.json(
      { success: true, documents: contextDocuments },
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
