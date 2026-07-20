import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AtlasPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-background px-6 py-10 text-foreground">
      <Button
        variant="link"
        size="sm"
        className="self-start px-0"
        render={<Link href="/" />}
      >
        ← Collage
      </Button>
      <h1 className="font-heading text-3xl">Atlas 図鑑</h1>
      <p className="text-muted-foreground">
        Species catalog arrives in a later ticket. Fixture collage data is on
        the home view for now.
      </p>
    </main>
  );
}
