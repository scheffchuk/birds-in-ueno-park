"use client";

import { useEffect, useState } from "react";
import { AdminPageClient } from "./AdminPageClient";

/**
 * Root layout Suspense may render this route before Convex Auth providers
 * mount. Defer the auth-bound admin UI until the client has providers.
 */
export function AdminClientGate() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <p className="px-6 py-10 font-mono text-[10px] tracking-[0.18em] text-ink-soft uppercase">
        Loading admin…
      </p>
    );
  }

  return <AdminPageClient />;
}
