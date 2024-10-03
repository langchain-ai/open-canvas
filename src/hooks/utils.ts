import { Client } from "@langchain/langgraph-sdk";

export const createClient = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
  return new Client({
    apiUrl,
  });
};
