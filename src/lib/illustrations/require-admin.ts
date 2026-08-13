import { api, pipelineClient } from "./pipeline-client";

/** Auth a Convex HTTP client with the admin JWT; 403 if not allowlisted. */
export async function requireAdminPipelineClient(token: string) {
  const client = pipelineClient();
  client.setAuth(token);
  const isAdmin = await client.query(api.admin.viewerIsAdmin, {});
  if (!isAdmin) {
    return {
      ok: false as const,
      response: Response.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }
  return { ok: true as const, client };
}
