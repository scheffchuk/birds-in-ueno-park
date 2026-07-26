import { AdminClientGate } from "./AdminClientGate";

/** Admin stays fully dynamic — no Partial Prefetching instant shell. */
export const instant = false;

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AdminClientGate />
    </main>
  );
}
