import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  type QueryCtx,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const orphanReportValidator = v.object({
  storageCount: v.number(),
  referencedCount: v.number(),
  orphanCount: v.number(),
  orphanBytes: v.number(),
  referencedBytes: v.number(),
  totalBytes: v.number(),
  orphanIds: v.array(v.id("_storage")),
});

const gcResultValidator = v.object({
  dryRun: v.boolean(),
  deleted: v.number(),
  bytesFreed: v.number(),
  remaining: v.number(),
  storageCount: v.number(),
  referencedCount: v.number(),
  orphanCount: v.number(),
  orphanBytes: v.number(),
  referencedBytes: v.number(),
  totalBytes: v.number(),
});

type OrphanReport = {
  storageCount: number;
  referencedCount: number;
  orphanCount: number;
  orphanBytes: number;
  referencedBytes: number;
  totalBytes: number;
  orphanIds: Id<"_storage">[];
};

type GcResult = {
  dryRun: boolean;
  deleted: number;
  bytesFreed: number;
  remaining: number;
  storageCount: number;
  referencedCount: number;
  orphanCount: number;
  orphanBytes: number;
  referencedBytes: number;
  totalBytes: number;
};

/** Collect every `_storage` id referenced by species or stylePrints. */
async function collectReferencedStorageIds(
  ctx: QueryCtx,
): Promise<Set<Id<"_storage">>> {
  const referenced = new Set<Id<"_storage">>();
  // eslint-disable-next-line @convex-dev/no-query-collect -- bounded guide catalog
  const species = await ctx.db.query("species").collect();
  for (const sp of species) {
    if (sp.illustrationPerch) referenced.add(sp.illustrationPerch);
    if (sp.illustrationFlight) referenced.add(sp.illustrationFlight);
    if (sp.anatomyRef) referenced.add(sp.anatomyRef);
    if (sp.anatomyRefFlight) referenced.add(sp.anatomyRefFlight);
  }
  // eslint-disable-next-line @convex-dev/no-query-collect -- tiny style-print table
  const stylePrints = await ctx.db.query("stylePrints").collect();
  for (const row of stylePrints) {
    referenced.add(row.storageId);
  }
  return referenced;
}

export const listOrphanStorage = internalQuery({
  args: {},
  returns: orphanReportValidator,
  handler: async (ctx): Promise<OrphanReport> => {
    // eslint-disable-next-line @convex-dev/no-query-collect -- one-shot GC inventory
    const files = await ctx.db.system.query("_storage").collect();
    const referenced = await collectReferencedStorageIds(ctx);

    const orphanIds: Id<"_storage">[] = [];
    let orphanBytes = 0;
    let referencedBytes = 0;
    let totalBytes = 0;

    for (const file of files) {
      totalBytes += file.size;
      if (referenced.has(file._id)) {
        referencedBytes += file.size;
      } else {
        orphanIds.push(file._id);
        orphanBytes += file.size;
      }
    }

    return {
      storageCount: files.length,
      referencedCount: referenced.size,
      orphanCount: orphanIds.length,
      orphanBytes,
      referencedBytes,
      totalBytes,
      orphanIds,
    };
  },
});

export const deleteOrphanStorageBatch = internalMutation({
  args: {
    ids: v.array(v.id("_storage")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let deleted = 0;
    for (const id of args.ids) {
      await ctx.storage.delete(id);
      deleted += 1;
    }
    return deleted;
  },
});

async function runGc(
  ctx: {
    runQuery: (
      ref: typeof internal.storageGc.listOrphanStorage,
      args: Record<string, never>,
    ) => Promise<OrphanReport>;
    runMutation: (
      ref: typeof internal.storageGc.deleteOrphanStorageBatch,
      args: { ids: Id<"_storage">[] },
    ) => Promise<number>;
  },
  args: { dryRun: boolean; batchSize?: number },
): Promise<GcResult> {
  const report = await ctx.runQuery(internal.storageGc.listOrphanStorage, {});

  if (args.dryRun) {
    return {
      dryRun: true,
      deleted: 0,
      bytesFreed: 0,
      remaining: report.orphanCount,
      storageCount: report.storageCount,
      referencedCount: report.referencedCount,
      orphanCount: report.orphanCount,
      orphanBytes: report.orphanBytes,
      referencedBytes: report.referencedBytes,
      totalBytes: report.totalBytes,
    };
  }

  const batchSize = args.batchSize ?? 50;
  let deleted = 0;
  for (let i = 0; i < report.orphanIds.length; i += batchSize) {
    const batch = report.orphanIds.slice(i, i + batchSize);
    deleted += await ctx.runMutation(
      internal.storageGc.deleteOrphanStorageBatch,
      { ids: batch },
    );
  }

  const after = await ctx.runQuery(internal.storageGc.listOrphanStorage, {});

  return {
    dryRun: false,
    deleted,
    bytesFreed: report.orphanBytes - after.orphanBytes,
    remaining: after.orphanCount,
    storageCount: after.storageCount,
    referencedCount: after.referencedCount,
    orphanCount: after.orphanCount,
    orphanBytes: after.orphanBytes,
    referencedBytes: after.referencedBytes,
    totalBytes: after.totalBytes,
  };
}

/** CLI: `pnpm exec convex run storageGc:gcOrphanStorageInternal '{"dryRun":true}'` */
export const gcOrphanStorageInternal = internalAction({
  args: {
    dryRun: v.boolean(),
    batchSize: v.optional(v.number()),
  },
  returns: gcResultValidator,
  handler: async (ctx, args): Promise<GcResult> => runGc(ctx, args),
});

/** Browser/admin session entry point. */
export const gcOrphanStorage = action({
  args: {
    dryRun: v.boolean(),
    batchSize: v.optional(v.number()),
  },
  returns: gcResultValidator,
  handler: async (ctx, args): Promise<GcResult> => {
    const isAdmin = await ctx.runQuery(api.admin.viewerIsAdmin, {});
    if (!isAdmin) throw new Error("Unauthorized");
    return await runGc(ctx, args);
  },
});
