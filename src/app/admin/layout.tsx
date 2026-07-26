import { connection } from "next/server";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexAuthClientProvider } from "@/components/Providers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <ConvexAuthNextjsServerProvider>
      <ConvexAuthClientProvider>{children}</ConvexAuthClientProvider>
    </ConvexAuthNextjsServerProvider>
  );
}
