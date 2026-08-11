import { describe, expect, it } from "vitest";
import {
  classifyProxyPath,
  requiresConvexAuthMiddleware,
  requiresI18nMiddleware,
} from "./path-scope";

describe("classifyProxyPath", () => {
  it("classifies admin routes", () => {
    expect(classifyProxyPath("/admin")).toBe("admin");
    expect(classifyProxyPath("/admin/")).toBe("admin");
    expect(classifyProxyPath("/admin/login")).toBe("admin");
  });

  it("classifies api routes", () => {
    expect(classifyProxyPath("/api")).toBe("api");
    expect(classifyProxyPath("/api/auth")).toBe("api");
    expect(classifyProxyPath("/api/illustrations/generate")).toBe("api");
  });

  it("classifies Locale and other public routes", () => {
    expect(classifyProxyPath("/")).toBe("public");
    expect(classifyProxyPath("/ja")).toBe("public");
    expect(classifyProxyPath("/ja/atlas")).toBe("public");
    expect(classifyProxyPath("/en/atlas/mallard")).toBe("public");
    expect(classifyProxyPath("/zh-tw/about")).toBe("public");
  });

  it("does not treat prefix lookalikes as admin or api", () => {
    expect(classifyProxyPath("/adminish")).toBe("public");
    expect(classifyProxyPath("/apiary")).toBe("public");
    expect(classifyProxyPath("/ja/admin")).toBe("public");
  });
});

describe("requiresConvexAuthMiddleware", () => {
  it("runs auth middleware for admin and api only", () => {
    expect(requiresConvexAuthMiddleware("/admin")).toBe(true);
    expect(requiresConvexAuthMiddleware("/api/illustrations/generate")).toBe(
      true,
    );
    expect(requiresConvexAuthMiddleware("/ja")).toBe(false);
    expect(requiresConvexAuthMiddleware("/en/atlas")).toBe(false);
  });
});

describe("requiresI18nMiddleware", () => {
  it("runs next-intl only on public Locale routes", () => {
    expect(requiresI18nMiddleware("/ja")).toBe(true);
    expect(requiresI18nMiddleware("/admin")).toBe(false);
    expect(requiresI18nMiddleware("/api/auth")).toBe(false);
  });
});
