"use client";

import { Canvas } from "@/components/canvas";
import { GraphProvider } from "@/contexts/GraphContext";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense>
      <GraphProvider>
        <Canvas />
      </GraphProvider>
    </Suspense>
  );
}
