import type { Metadata } from "next";
import Link from "next/link";
import { RootShell } from "@/components/site/RootShell";

export const metadata: Metadata = {
  title: "ページが見つかりません · 上野の鳥たち",
  description: "お探しのページは存在しません。",
};

export default function GlobalNotFound() {
  return (
    <RootShell lang="ja">
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <h1 className="font-heading text-2xl tracking-tight text-ink">
          ページが見つかりません
        </h1>
        <p className="text-sm text-ink-2">お探しのページは存在しません。</p>
        <Link
          href="/ja"
          className="font-mono text-[10px] tracking-[0.18em] text-ink uppercase underline decoration-hairline underline-offset-4"
        >
          上野の鳥たち
        </Link>
      </main>
    </RootShell>
  );
}
