import type { Metadata } from "next";
import { connection } from "next/server";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexAuthClientProvider } from "./ConvexAuthClientProvider";
import { RootShell } from "@/components/site/RootShell";

export const metadata: Metadata = {
  title: "Birds in Ueno · Admin",
  description: "Admin for the Ueno Park bird guide.",
  appleWebApp: {
    title: "Birds in Ueno",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <RootShell lang="en">
      <ConvexAuthNextjsServerProvider>
        <ConvexAuthClientProvider>{children}</ConvexAuthClientProvider>
      </ConvexAuthNextjsServerProvider>
    </RootShell>
  );
}
