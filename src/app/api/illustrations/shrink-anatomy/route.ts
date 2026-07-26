import { api } from "@/lib/illustrations/pipeline-client";
import { requireAdminPipelineClient } from "@/lib/illustrations/require-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  limit?: number;
  /** Convex Auth JWT from the admin session. */
  token: string;
};

function parseShrinkAnatomyBody(data: unknown): Body | null {
  if (typeof data !== "object" || data === null) return null;
  if (
    !("token" in data) ||
    typeof data.token !== "string" ||
    data.token.length === 0
  ) {
    return null;
  }
  const body: Body = { token: data.token };
  if ("limit" in data && typeof data.limit === "number") {
    body.limit = data.limit;
  }
  return body;
}

/**
 * Admin re-encode of oversized Anatomy references.
 * Auth here; shrink logic stays in the Convex action.
 */
export async function POST(request: Request) {
  const body = parseShrinkAnatomyBody(await request.json());
  if (!body) {
    return Response.json({ error: "token required" }, { status: 401 });
  }

  const auth = await requireAdminPipelineClient(body.token);
  if (!auth.ok) return auth.response;

  try {
    const result = await auth.client.action(
      api.illustrationAnatomy.shrinkOversizedAnatomyRefs,
      { limit: body.limit },
    );
    return Response.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Anatomy shrink failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
