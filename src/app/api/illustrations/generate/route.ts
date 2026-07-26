import { createIllustrationGenerateAdapters } from "@/lib/illustrations/ops-adapters";
import {
  generateIllustrations,
  type IllustrationPose,
} from "@/lib/illustrations/ops";
import {
  api,
  pipelineClient,
} from "@/lib/illustrations/pipeline-client";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  limit?: number;
  slugs?: string[];
  /** Limit generation to these poses (default both). */
  poses?: IllustrationPose[];
  /** Convex Auth JWT from the admin session. */
  token: string;
};

function parseGenerateBody(data: unknown): Body | null {
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
  if (
    "slugs" in data &&
    Array.isArray(data.slugs) &&
    data.slugs.every((s): s is string => typeof s === "string")
  ) {
    body.slugs = data.slugs;
  }
  if (
    "poses" in data &&
    Array.isArray(data.poses) &&
    data.poses.every(
      (p): p is IllustrationPose => p === "perch" || p === "flight",
    )
  ) {
    body.poses = data.poses;
  }
  return body;
}

/**
 * Admin-triggered Gemini Flash Image generates for missing poses (default 20).
 * Thin adapter over Illustration pipeline ops.
 */
export async function POST(request: Request) {
  const body = parseGenerateBody(await request.json());
  if (!body) {
    return Response.json({ error: "token required" }, { status: 401 });
  }

  const client = pipelineClient();
  client.setAuth(body.token);

  const isAdmin = await client.query(api.admin.viewerIsAdmin, {});
  if (!isAdmin) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      { error: "AI_GATEWAY_API_KEY required for Gemini image edit" },
      { status: 500 },
    );
  }

  const result = await generateIllustrations(
    {
      limit: body.limit,
      slugs: body.slugs,
      poses: body.poses,
    },
    createIllustrationGenerateAdapters(body.token),
  );

  return Response.json(result);
}
