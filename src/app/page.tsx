import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { CollageClient } from "./CollageClient";

export default async function HomePage() {
  const preloaded = await preloadQuery(api.species.listForCollage);
  return <CollageClient preloaded={preloaded} />;
}
