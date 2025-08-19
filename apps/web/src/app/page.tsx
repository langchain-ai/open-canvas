"use client";

import { Canvas } from "@/components/canvas";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { UserProvider } from "@/contexts/UserContext";
import { Suspense } from "react";

export default function Home() {
  if (process.env.NEXT_PUBLIC_LOCAL_MODE === 'true') {
    return (
      <Suspense>
        <UserProvider>
          <ThreadProvider>
            <AssistantProvider>
              <GraphProvider>
                <Canvas />
              </GraphProvider>
            </AssistantProvider>
          </ThreadProvider>
        </UserProvider>
      </Suspense>
    );
  } else {
    // Redirect to login or handle auth as before
    // For now, let's just return a simple message
    return <div>Auth mode is not local</div>;
  }
}
