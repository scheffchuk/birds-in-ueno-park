import type { ConvexHttpClient } from "convex/browser";
import { api, pipelineClient } from "./pipeline-client";

export type AdminPipelineClientResult =
  | { ok: true; client: ConvexHttpClient }
  | { ok: false; response: Response };

/** Auth a Convex HTTP client with the admin JWT; 403 if not allowlisted. */
export async function requireAdminPipelineClient(
  token: string,
): Promise<AdminPipelineClientResult> {
  const client = pipelineClient();
  client.setAuth(token);
  const isAdmin = await client.query(api.admin.viewerIsAdmin, {});
  if (!isAdmin) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }
  return { ok: true, client };
}
