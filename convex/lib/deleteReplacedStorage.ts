import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Delete the previous blob when a storage field is replaced with a different id. */
export async function deleteReplacedStorage(
  ctx: MutationCtx,
  previous: Id<"_storage"> | undefined,
  next: Id<"_storage">,
): Promise<void> {
  if (previous !== undefined && previous !== next) {
    await ctx.storage.delete(previous);
  }
}
