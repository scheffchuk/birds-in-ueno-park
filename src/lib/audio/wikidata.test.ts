import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWikidata } from "./wikidata";

describe("fetchWikidata", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("identifies the audio selector to Wikidata", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWikidata("https://query.wikidata.org/sparql");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://query.wikidata.org/sparql",
      {
        headers: {
          Accept: "application/sparql-results+json",
          "Api-User-Agent": expect.stringContaining("birds-in-ueno"),
          "User-Agent": expect.stringContaining("birds-in-ueno"),
        },
      },
    );
  });
});
