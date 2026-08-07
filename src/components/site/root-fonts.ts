import { Literata, Source_Sans_3 } from "next/font/google";
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

export function rootFontClassName(): string {
  return cn("h-full font-sans", display.variable, sans.variable);
}
