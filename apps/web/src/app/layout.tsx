import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LegalEase Africa – Smart Legal Support for Startups",
  description: "Affordable legal services for African startups and SMEs. Templates, compliance tools, and local legal experts—on subscription.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen">
      <body className={cn("min-h-full", inter.className)}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
