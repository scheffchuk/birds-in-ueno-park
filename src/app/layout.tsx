import type { Metadata } from "next";
import { Suspense } from "react";
import { Literata, Source_Sans_3 } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = Literata({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const sans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Birds in Ueno",
  description:
    "A curated bird guide for Ueno Park and Shinobazu Pond — collage sized by seasonal Prevalence.",
};

async function AuthBound({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <Providers>{children}</Providers>
    </ConvexAuthNextjsServerProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full font-sans", display.variable, sans.variable)}
    >
      <body className="flex min-h-full flex-col antialiased">
        {/*
          Cookie auth must not block the static shell. Fallback renders route
          chrome without Providers (Convex Auth client needs the server provider).
        */}
        <Suspense fallback={children}>
          <AuthBound>{children}</AuthBound>
        </Suspense>
      </body>
    </html>
  );
}
