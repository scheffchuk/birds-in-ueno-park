import { describe, expect, it } from "vitest";
import { retryForbiddenRequest, xenoCantoQueryForSpecies } from "./xeno";

describe("xenoCantoQueryForSpecies", () => {
  it("uses v3 taxonomic tags for a binomial scientific name", () => {
    expect(xenoCantoQueryForSpecies("Passer montanus")).toBe(
      "gen:Passer sp:montanus",
    );
  });

  it("rejects names that cannot be made into a species query", () => {
    expect(() => xenoCantoQueryForSpecies("Passer")).toThrow(
      "binomial scientific name",
    );
  });

  it("retries temporary 403 responses but not authentication failures", async () => {
    let calls = 0;
    const response = await retryForbiddenRequest(
      async () => {
        calls += 1;
        return calls === 1
          ? new Response("blocked", { status: 403 })
          : new Response("ok", { status: 200 });
      },
      { baseDelayMs: 0, sleep: async () => undefined },
    );

    expect(response.status).toBe(200);
    expect(calls).toBe(2);

    calls = 0;
    const unauthorized = await retryForbiddenRequest(
      async () => {
        calls += 1;
        return new Response("unauthorized", { status: 401 });
      },
      { sleep: async () => undefined },
    );

    expect(unauthorized.status).toBe(401);
    expect(calls).toBe(1);
  });

  it("allows a longer transient block to clear", async () => {
    let calls = 0;
    const delays: number[] = [];
    const response = await retryForbiddenRequest(
      async () => {
        calls += 1;
        return calls < 5
          ? new Response("blocked", { status: 403 })
          : new Response("ok", { status: 200 });
      },
      {
        baseDelayMs: 10,
        sleep: async (delayMs) => {
          delays.push(delayMs);
        },
      },
    );

    expect(response.status).toBe(200);
    expect(calls).toBe(5);
    expect(delays).toEqual([10, 20, 40, 80]);
  });
});
