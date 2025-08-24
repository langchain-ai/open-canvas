export const cleanBase64 = (input: string): string =>
  input.replace(/^data:.*?;base64,/, "");

export const decodeBase64ToUtf8 = (b64: string): string => {
  const cleaned = cleanBase64(b64);
  return Buffer.from(cleaned, "base64").toString("utf8");
};

export const encodeUtf8ToBase64 = (s: string): string =>
  Buffer.from(s, "utf8").toString("base64");
