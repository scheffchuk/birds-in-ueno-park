import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { rootFontClassName } from "@/components/site/root-fonts";
import "@/app/globals.css";

/** Shared document shell for dual root layouts and global-not-found. */
export function RootShell({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={rootFontClassName()}
    >
      <body className="flex min-h-full flex-col antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
