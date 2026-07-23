import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        className={cn("h-full font-sans", display.variable, sans.variable)}
      >
        <body className="flex min-h-full flex-col antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
