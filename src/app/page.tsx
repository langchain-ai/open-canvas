"use client";
import { Canvas } from "@/components/Canvas";
import { AuthProvider } from "../contexts/AuthContext";

export default function Home() {
  return (
    <AuthProvider>
      <Canvas />
    </AuthProvider>
  );
}
