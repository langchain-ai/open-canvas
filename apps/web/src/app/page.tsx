import { Github } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 px-4 text-center">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Open Canvas Demo
          </h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
        </div>

        <p className="text-lg leading-relaxed text-gray-300 sm:text-xl">
          This demo is no longer live or maintained. However, you can still
          clone the repository and run Open Canvas yourself!
        </p>

        <Link
          href="https://github.com/langchain-ai/open-canvas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg"
        >
          <Github className="h-5 w-5" />
          View on GitHub
        </Link>

        <p className="text-sm text-gray-500">
          github.com/langchain-ai/open-canvas
        </p>
      </div>
    </main>
  );
}
