// pdf.ts
import { cleanBase64 } from "./base64";
import pdfParse from "pdf-parse";

export async function convertPDFToText(base64PDF: string) {
  const cleaned = cleanBase64(base64PDF);
  const pdfBuffer = Buffer.from(cleaned, "base64");
  const data = await pdfParse(pdfBuffer);
  return data.text;
}
