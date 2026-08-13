import { createIllustrationGenerateAdapters } from "@/lib/illustrations/ops-adapters";
import {
  generateIllustrations,
  type GenerateIllustrationsInput,
  type IllustrationPose,
} from "@/lib/illustrations/ops";
import { requireAdminPipelineClient } from "@/lib/illustrations/require-admin";

export const maxDuration = 300;

function parseGenerateBody(
  data: unknown,
): (GenerateIllustrationsInput & { token: string }) | null {
  if (typeof data !== "object" || data === null) return null;
  if (
    !("token" in data) ||
    typeof data.token !== "string" ||
    data.token.length === 0
  ) {
    return null;
  }
  const body: GenerateIllustrationsInput & { token: string } = { token: data.token };
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

  const auth = await requireAdminPipelineClient(body.token);
  if (!auth.ok) return auth.response;

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
