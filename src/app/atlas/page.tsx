import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AtlasPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-background px-6 py-10 text-foreground">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "link", size: "sm" }),
          "self-start px-0",
        )}
      >
        ← Collage
      </Link>
      <h1 className="font-heading text-3xl">Atlas 図鑑</h1>
      <p className="text-muted-foreground">
        Species catalog arrives in a later ticket. Fixture collage data is on
        the home view for now.
      </p>
    </main>
  );
}
