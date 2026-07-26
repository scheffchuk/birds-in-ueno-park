import { createIllustrationRejectRegenAdapters } from "@/lib/illustrations/ops-adapters";
import {
  rejectAndRegenerateIllustrations,
  type IllustrationPose,
} from "@/lib/illustrations/ops";
import {
  api,
  pipelineClient,
} from "@/lib/illustrations/pipeline-client";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  speciesId: string;
  pose?: IllustrationPose;
  /** Convex Auth JWT from the admin session. */
  token: string;
};

function parseRejectRegenBody(data: unknown): Body | null {
  if (typeof data !== "object" || data === null) return null;
  if (
    !("token" in data) ||
    typeof data.token !== "string" ||
    data.token.length === 0
  ) {
    return null;
  }
  if (
    !("speciesId" in data) ||
    typeof data.speciesId !== "string" ||
    data.speciesId.length === 0
  ) {
    return null;
  }
  const body: Body = { token: data.token, speciesId: data.speciesId };
  if (
    "pose" in data &&
    (data.pose === "perch" || data.pose === "flight")
  ) {
    body.pose = data.pose;
  }
  return body;
}

/**
 * Admin reject-and-regenerate (pair or single pose).
 * Thin adapter over Illustration pipeline ops — same generate family as /generate.
 */
export async function POST(request: Request) {
  const body = parseRejectRegenBody(await request.json());
  if (!body) {
    return Response.json(
      { error: "token and speciesId required" },
      { status: 401 },
    );
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

  try {
    const result = await rejectAndRegenerateIllustrations(
      { speciesId: body.speciesId, pose: body.pose },
      createIllustrationRejectRegenAdapters(body.token),
    );
    return Response.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Reject-and-regenerate failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
