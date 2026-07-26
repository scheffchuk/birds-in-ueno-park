import { describe, expect, it, vi } from "vitest";
import {
  generateIllustrations,
  type IllustrationGenerateAdapters,
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
