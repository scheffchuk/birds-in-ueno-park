import { createIllustrationAnatomySeedAdapters } from "@/lib/illustrations/ops-adapters";
import {
  seedAnatomyReferences,
  type AnatomySeedSpecies,
  type IllustrationPose,
} from "@/lib/illustrations/ops";
import { requireAdminPipelineClient } from "@/lib/illustrations/require-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  pose: IllustrationPose;
  species: AnatomySeedSpecies[];
  /** Convex Auth JWT from the admin session. */
  token: string;
};

function parseSpecies(value: unknown): AnatomySeedSpecies[] | null {
  if (!Array.isArray(value)) return null;
  const species: AnatomySeedSpecies[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    if (
      !("slug" in item) ||
      typeof item.slug !== "string" ||
      item.slug.length === 0
    ) {
      return null;
    }
    if (
      !("sciName" in item) ||
      typeof item.sciName !== "string" ||
      item.sciName.length === 0
    ) {
      return null;
    }
    if (
      !("comNameEn" in item) ||
      typeof item.comNameEn !== "string" ||
      item.comNameEn.length === 0
    ) {
      return null;
    }
    species.push({
      slug: item.slug,
      sciName: item.sciName,
      comNameEn: item.comNameEn,
    });
  }
  return species;
}

function parseSeedAnatomyBody(data: unknown): Body | null {
  if (typeof data !== "object" || data === null) return null;
  if (
    !("token" in data) ||
    typeof data.token !== "string" ||
    data.token.length === 0
  ) {
    return null;
  }
  if (
    !("pose" in data) ||
    (data.pose !== "perch" && data.pose !== "flight")
  ) {
    return null;
  }
  if (!("species" in data)) return null;
  const species = parseSpecies(data.species);
  if (!species) return null;
  return { token: data.token, pose: data.pose, species };
}

/**
 * Admin Anatomy reference seed for a Guide species slice (perch or flight).
 * Thin adapter over Illustration pipeline ops.
 */
export async function POST(request: Request) {
  const body = parseSeedAnatomyBody(await request.json());
  if (!body) {
    return Response.json(
      { error: "token, pose, and species required" },
      { status: 401 },
    );
  }

  const auth = await requireAdminPipelineClient(body.token);
  if (!auth.ok) return auth.response;

  try {
    const result = await seedAnatomyReferences(
      { pose: body.pose, species: body.species },
      createIllustrationAnatomySeedAdapters(body.token, auth.client),
    );
    return Response.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Anatomy seed failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
