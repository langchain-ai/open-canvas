const actualNewline = `
`;

export const cleanContent = (content: string): string => {
  return content ? content.replace(/\\n/g, actualNewline) : "";
};

export const reverseCleanContent = (content: string): string => {
  return content ? content.replaceAll(actualNewline, "\n") : "";
};

export const newlineToCarriageReturn = (str: string) =>
  // str.replace(actualNewline, "\r\n");
  str.replace(actualNewline, [actualNewline, actualNewline].join(""));

export const emptyLineCount = (content: string): number => {
  const liens = content.split("\n");
  return liens.filter((line) => line.trim() == "").length;
};
