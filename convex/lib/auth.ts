import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isGitHubIdAllowlisted } from "./allowlist";

/**
 * Require Convex Auth session whose GitHub account id is in ADMIN_GITHUB_IDS.
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }

  const account = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", userId).eq("provider", "github"),
    )
    .unique();

  if (!account) {
    throw new Error("Not authenticated");
  }

  const allowlist = process.env.ADMIN_GITHUB_IDS ?? "";
  if (!isGitHubIdAllowlisted(account.providerAccountId, allowlist)) {
    throw new Error("Unauthorized");
  }
}
