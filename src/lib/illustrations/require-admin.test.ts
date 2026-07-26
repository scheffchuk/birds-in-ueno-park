import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
const setAuth = vi.fn();

vi.mock("./pipeline-client", () => ({
  api: { admin: { viewerIsAdmin: "viewerIsAdmin" } },
  pipelineClient: () => ({ setAuth, query }),
}));

import { requireAdminPipelineClient } from "./require-admin";

describe("requireAdminPipelineClient", () => {
  beforeEach(() => {
    query.mockReset();
    setAuth.mockReset();
  });

  it("returns an authed client when the viewer is an admin", async () => {
    query.mockResolvedValue(true);

    const result = await requireAdminPipelineClient("jwt-token");

    expect(setAuth).toHaveBeenCalledWith("jwt-token");
    expect(query).toHaveBeenCalledWith("viewerIsAdmin", {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.client.setAuth).toBe(setAuth);
    }
  });

  it("returns 403 when the viewer is not an admin", async () => {
    query.mockResolvedValue(false);

    const result = await requireAdminPipelineClient("jwt-token");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        error: "Unauthorized",
      });
    }
  });
});
