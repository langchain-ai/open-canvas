import pdfParse from "pdf-parse";
export const cleanBase64 = (base64String: string): string => {
  return base64String.replace(/^data:.*?;base64,/, "");
};

export async function convertPDFToText(base64PDF: string) {
  try {
    // Clean the base64 input first
    const cleanedBase64 = cleanBase64(base64PDF);

    // Convert cleaned base64 to buffer
    const pdfBuffer = Buffer.from(cleanedBase64, "base64");

    // Parse PDF
    const data = await pdfParse(pdfBuffer);

    // Get text content
    return data.text;
  } catch (error) {
    console.error("Error converting PDF to text:", error);
    throw error;
  }
}
