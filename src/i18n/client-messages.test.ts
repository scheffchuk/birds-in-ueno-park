import { describe, expect, it } from "vitest";
import {
  CLIENT_MESSAGE_NAMESPACES,
  pickClientMessages,
} from "./client-messages";

describe("pickClientMessages", () => {
  it("keeps only client namespaces", () => {
    const picked = pickClientMessages({
      Collage: { emptyTitle: "a" },
      Season: { winter: "Winter" },
      Atlas: { title: "Atlas" },
      AtlasDetail: { prevalence: "Prevalence" },
      LocaleSwitcher: { label: "Language" },
      About: { title: "About" },
      Meta: { title: "Meta" },
      Nav: { atlas: "Atlas" },
      Home: { title: "Home" },
      Footer: { credit: "Inspired by" },
    });

    expect(Object.keys(picked).sort()).toEqual(
      [...CLIENT_MESSAGE_NAMESPACES].sort(),
    );
    expect(picked).not.toHaveProperty("About");
    expect(picked).not.toHaveProperty("Meta");
    expect(picked).not.toHaveProperty("Nav");
    expect(picked).not.toHaveProperty("Home");
    expect(picked).not.toHaveProperty("Footer");
    expect(picked.Collage).toEqual({ emptyTitle: "a" });
  });

  it("omits allowlisted namespaces that are missing from the catalog", () => {
    const picked = pickClientMessages({
      Season: { all: "All year" },
    });
    expect(picked).toEqual({ Season: { all: "All year" } });
  });
});
