import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export function pipelineClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  return new ConvexHttpClient(url);
}

export function pipelineSecret(): string {
  const secret = process.env.ILLUSTRATION_PIPELINE_SECRET;
  if (!secret) throw new Error("ILLUSTRATION_PIPELINE_SECRET is not set");
  return secret;
}

export { api };
