import { describe, expect, it, vi } from "vitest";
import {
  generateIllustrations,
  rejectAndRegenerateIllustrations,
  seedAnatomyReferences,
  shrinkOversizedAnatomyReferences,
  type IllustrationGenerateAdapters,
  type IllustrationPose,
  type IllustrationRejectRegenAdapters,
  type IllustrationAnatomySeedAdapters,
  type IllustrationAnatomyShrinkAdapters,
  type PreparedGenerateRequest,
} from "./ops";

const sampleRequest = (
  overrides: Partial<PreparedGenerateRequest> = {},
): PreparedGenerateRequest => ({
  customId: "mejiro:perch",
  prompt: "draw mejiro perch",
  images: [
    { imageUrl: "https://example.com/anatomy/perch/mejiro" },
    { imageUrl: "https://example.com/style/perch" },
  ],
  slug: "mejiro",
  pose: "perch",
  sciName: "Zosterops japonicus",
  comNameEn: "Japanese White-eye",
  ...overrides,
});

function stubAdapters(
  overrides: Partial<IllustrationGenerateAdapters> = {},
): IllustrationGenerateAdapters & {
  failPoseCalls: Array<{ slug: string; reason: string }>;
  startedWorkflows: string[];
} {
  const failPoseCalls: Array<{ slug: string; reason: string }> = [];
  const startedWorkflows: string[] = [];
  return {
    failPoseCalls,
    startedWorkflows,
    prepare: vi.fn(async () => ({
      requests: [sampleRequest()],
      skipped: [] as string[],
    })),
    edit: vi.fn(async () => ({ pngBytes: Buffer.from("png") })),
    uploadPng: vi.fn(async () => "https://storage.example/interim.png"),
    startWorkflow: vi.fn(async (input) => {
      startedWorkflows.push(input.customId);
    }),
    failPose: vi.fn(async (input) => {
      failPoseCalls.push(input);
    }),
    ...overrides,
  };
}

describe("generateIllustrations", () => {
  it("reports empty slice when prepare yields no requests", async () => {
    const adapters = stubAdapters({
      prepare: async () => ({
        requests: [],
        skipped: ["uguisu"],
        emptyReason: "No Guide species with pose-matched Anatomy references",
      }),
    });

    const result = await generateIllustrations({ limit: 20 }, adapters);

    expect(result).toEqual({
      ok: true,
      mode: "gemini",
      model: "google/gemini-2.5-flash-image",
      requestCount: 0,
      started: 0,
      failed: 0,
      skipped: ["uguisu"],
      message: "No Guide species with pose-matched Anatomy references",
    });
    expect(adapters.edit).not.toHaveBeenCalled();
  });

  it("starts Workflow for each successful Gemini edit", async () => {
    const adapters = stubAdapters({
      prepare: async () => ({
        requests: [
          sampleRequest({ customId: "mejiro:perch", pose: "perch" }),
          sampleRequest({
            customId: "mejiro:flight",
            pose: "flight",
            images: [
              { imageUrl: "https://example.com/anatomy/flight/mejiro" },
              { imageUrl: "https://example.com/style/flight" },
            ],
          }),
        ],
        skipped: [],
      }),
    });

    const result = await generateIllustrations(
      { slugs: ["mejiro"], poses: ["perch", "flight"] },
      adapters,
    );

    expect(result.started).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.requestCount).toBe(2);
    expect(result.mode).toBe("gemini");
    expect(result.model).toBe("google/gemini-2.5-flash-image");
    expect(adapters.startedWorkflows.sort()).toEqual([
      "mejiro:flight",
      "mejiro:perch",
    ]);
  });

  it("marks failed closed when Gemini edit throws", async () => {
    const adapters = stubAdapters({
      edit: async () => {
        throw new Error("gateway timeout");
      },
    });

    const result = await generateIllustrations({ slugs: ["mejiro"] }, adapters);

    expect(result.started).toBe(0);
    expect(result.failed).toBe(1);
    expect(adapters.failPoseCalls).toEqual([
      { slug: "mejiro", reason: "gateway timeout" },
    ]);
    expect(adapters.startedWorkflows).toEqual([]);
  });

  it("counts mixed started and failed across a slice", async () => {
    const adapters = stubAdapters({
      prepare: async () => ({
        requests: [
          sampleRequest({
            customId: "mejiro:perch",
            slug: "mejiro",
            prompt: "draw mejiro perch",
          }),
          sampleRequest({
            customId: "suzume:perch",
            slug: "suzume",
            prompt: "draw suzume perch",
            sciName: "Passer montanus",
            comNameEn: "Eurasian Tree Sparrow",
          }),
        ],
        skipped: ["kawasemi"],
      }),
      edit: async ({ prompt }) => {
        if (prompt.includes("mejiro")) {
          throw new Error("bad anatomy");
        }
        return { pngBytes: Buffer.from("ok") };
      },
    });

    const result = await generateIllustrations({ limit: 2 }, adapters);

    expect(result).toMatchObject({
      requestCount: 2,
      started: 1,
      failed: 1,
      skipped: ["kawasemi"],
    });
    expect(adapters.failPoseCalls.map((c) => c.slug)).toEqual(["mejiro"]);
    expect(adapters.startedWorkflows).toEqual(["suzume:perch"]);
  });
});

function stubRejectRegenAdapters(
  overrides: Partial<IllustrationRejectRegenAdapters> = {},
): IllustrationRejectRegenAdapters & {
  rejectCalls: Array<{ speciesId: string; pose?: "perch" | "flight" }>;
  prepareInputs: Array<{
    slugs?: string[];
    poses?: Array<"perch" | "flight">;
    limit?: number;
  }>;
  startedWorkflows: string[];
} {
  const rejectCalls: Array<{
    speciesId: string;
    pose?: "perch" | "flight";
  }> = [];
  const prepareInputs: Array<{
    slugs?: string[];
    poses?: Array<"perch" | "flight">;
    limit?: number;
  }> = [];
  const startedWorkflows: string[] = [];
  return {
    rejectCalls,
    prepareInputs,
    startedWorkflows,
    reject: vi.fn(async (input) => {
      rejectCalls.push(input);
      const poses: IllustrationPose[] = input.pose
        ? [input.pose]
        : ["perch", "flight"];
      return { slug: "mejiro", poses };
    }),
    prepare: vi.fn(async (input) => {
      prepareInputs.push(input);
      const poses: IllustrationPose[] = input.poses ?? ["perch", "flight"];
      return {
        requests: poses.map((pose) =>
          sampleRequest({
            customId: `mejiro:${pose}`,
            pose,
            slug: "mejiro",
          }),
        ),
        skipped: [],
      };
    }),
    edit: vi.fn(async () => ({ pngBytes: Buffer.from("png") })),
    uploadPng: vi.fn(async () => "https://storage.example/interim.png"),
    startWorkflow: vi.fn(async (input) => {
      startedWorkflows.push(input.customId);
    }),
    failPose: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("rejectAndRegenerateIllustrations", () => {
  it("rejects the pair then regenerates both poses via generate", async () => {
    const adapters = stubRejectRegenAdapters();

    const result = await rejectAndRegenerateIllustrations(
      { speciesId: "species-mejiro" },
      adapters,
    );

    expect(adapters.rejectCalls).toEqual([{ speciesId: "species-mejiro" }]);
    expect(adapters.prepareInputs).toEqual([
      { slugs: ["mejiro"], poses: ["perch", "flight"], limit: 1 },
    ]);
    expect(result).toMatchObject({
      ok: true,
      mode: "gemini",
      started: 2,
      failed: 0,
      requestCount: 2,
    });
    expect(adapters.startedWorkflows.sort()).toEqual([
      "mejiro:flight",
      "mejiro:perch",
    ]);
  });

  it("rejects a single pose then regenerates only that pose", async () => {
    const adapters = stubRejectRegenAdapters();

    const result = await rejectAndRegenerateIllustrations(
      { speciesId: "species-mejiro", pose: "flight" },
      adapters,
    );

    expect(adapters.rejectCalls).toEqual([
      { speciesId: "species-mejiro", pose: "flight" },
    ]);
    expect(adapters.prepareInputs).toEqual([
      { slugs: ["mejiro"], poses: ["flight"], limit: 1 },
    ]);
    expect(result).toMatchObject({
      started: 1,
      failed: 0,
      requestCount: 1,
    });
    expect(adapters.startedWorkflows).toEqual(["mejiro:flight"]);
  });

  it("does not generate when reject fails", async () => {
    const adapters = stubRejectRegenAdapters({
      reject: async () => {
        throw new Error("Species not found");
      },
    });

    await expect(
      rejectAndRegenerateIllustrations(
        { speciesId: "missing" },
        adapters,
      ),
    ).rejects.toThrow("Species not found");

    expect(adapters.prepareInputs).toEqual([]);
    expect(adapters.startedWorkflows).toEqual([]);
  });
});

function stubAnatomySeedAdapters(
  overrides: Partial<IllustrationAnatomySeedAdapters> = {},
): IllustrationAnatomySeedAdapters & {
  ensureCalls: Array<{ slug: string; pose: IllustrationPose }>;
} {
  const ensureCalls: Array<{ slug: string; pose: IllustrationPose }> = [];
  return {
    ensureCalls,
    ensure: vi.fn(async (input) => {
      ensureCalls.push({ slug: input.slug, pose: input.pose });
      return { storageId: `stor-${input.slug}`, source: "stub" };
    }),
    delay: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("seedAnatomyReferences", () => {
  it("reports ok and failed counts for a perch Anatomy reference slice", async () => {
    const adapters = stubAnatomySeedAdapters({
      ensure: async (input) => {
        adapters.ensureCalls.push({ slug: input.slug, pose: input.pose });
        if (input.slug === "suzume") return { error: "no photo" };
        return { storageId: "stor-mejiro", source: "wikipedia" };
      },
    });

    const result = await seedAnatomyReferences(
      {
        pose: "perch",
        species: [
          {
            slug: "mejiro",
            sciName: "Zosterops japonicus",
            comNameEn: "Japanese White-eye",
          },
          {
            slug: "suzume",
            sciName: "Passer montanus",
            comNameEn: "Eurasian Tree Sparrow",
          },
        ],
      },
      adapters,
    );

    expect(result).toEqual({
      ok: 1,
      failed: 1,
      failures: ["suzume: no photo"],
    });
    expect(adapters.ensureCalls).toEqual([
      { slug: "mejiro", pose: "perch" },
      { slug: "suzume", pose: "perch" },
    ]);
    expect(adapters.delay).not.toHaveBeenCalled();
  });

  it("paces between flight Anatomy reference ensures", async () => {
    const delayMs: number[] = [];
    const adapters = stubAnatomySeedAdapters({
      delay: async (ms) => {
        delayMs.push(ms);
      },
    });

    const result = await seedAnatomyReferences(
      {
        pose: "flight",
        species: [
          {
            slug: "mejiro",
            sciName: "Zosterops japonicus",
            comNameEn: "Japanese White-eye",
          },
          {
            slug: "suzume",
            sciName: "Passer montanus",
            comNameEn: "Eurasian Tree Sparrow",
          },
        ],
      },
      adapters,
    );

    expect(result).toEqual({ ok: 2, failed: 0, failures: [] });
    expect(adapters.ensureCalls).toEqual([
      { slug: "mejiro", pose: "flight" },
      { slug: "suzume", pose: "flight" },
    ]);
    expect(delayMs).toEqual([600]);
  });
});

describe("shrinkOversizedAnatomyReferences", () => {
  it("returns checked/shrunk/skipped counts from the shrink adapter", async () => {
    const adapters: IllustrationAnatomyShrinkAdapters = {
      shrink: vi.fn(async ({ limit }) => ({
        checked: limit ?? 80,
        shrunk: 3,
        skipped: 5,
        errors: ["mejiro/perch: missing blob"],
      })),
    };

    const result = await shrinkOversizedAnatomyReferences(
      { limit: 80 },
      adapters,
    );

    expect(result).toEqual({
      checked: 80,
      shrunk: 3,
      skipped: 5,
      errors: ["mejiro/perch: missing blob"],
    });
    expect(adapters.shrink).toHaveBeenCalledWith({ limit: 80 });
  });
});
