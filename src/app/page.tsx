"use client";

import { Canvas } from "@/components/canvas";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { UserProvider } from "@/contexts/UserContext";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense>
      <UserProvider>
        <ThreadProvider>
          <GraphProvider>
            <Canvas />
          </GraphProvider>
        </ThreadProvider>
      </UserProvider>
    </Suspense>
  );
}
