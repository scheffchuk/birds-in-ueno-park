import { CollageView } from "@/components/collage/CollageView";
import { FIXTURE_SPECIES } from "@/lib/fixtures/guide-species";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <CollageView species={FIXTURE_SPECIES} />
    </main>
  );
}
