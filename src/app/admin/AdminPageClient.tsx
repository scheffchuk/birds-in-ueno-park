"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SEASONS = ["winter", "spring", "summer", "autumn"] as const;

type Season = (typeof SEASONS)[number];

export function AdminPageClient() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const isAdmin = useQuery(api.admin.viewerIsAdmin);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-display text-3xl tracking-tight">Admin</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Curate Guide species · provenance · Listed
          </p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="underline-offset-4 hover:underline">
            Collage
          </Link>
          <Link href="/atlas" className="underline-offset-4 hover:underline">
            Atlas
          </Link>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : null}
        </nav>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Checking session…</p>
      ) : !isAuthenticated ? (
        <section className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Sign in with GitHub. Only allowlisted accounts can mutate.
          </p>
          <Button onClick={() => void signIn("github", { redirectTo: "/admin" })}>
            Sign in with GitHub
          </Button>
        </section>
      ) : isAdmin === undefined ? (
        <p className="text-sm text-muted-foreground">Checking allowlist…</p>
      ) : !isAdmin ? (
        <p className="text-sm text-destructive">
          Signed in, but this GitHub account is not on the admin allowlist.
        </p>
      ) : (
        <AdminSpeciesPanel />
      )}
    </div>
  );
}

function AdminSpeciesPanel() {
  const species = useQuery(api.admin.listSpecies);
  const [showCreate, setShowCreate] = useState(false);

  if (species === undefined) {
    return <p className="text-sm text-muted-foreground">Loading species…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {species.length} species · curated fields marked
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Hide create" : "Create species"}
        </Button>
      </div>

      {showCreate ? <CreateSpeciesForm onDone={() => setShowCreate(false)} /> : null}

      <ul className="flex flex-col gap-6">
        {species.map((sp) => (
          <li key={sp._id}>
            <SpeciesEditor
              key={`${sp._id}-${sp.curatedFields.join(",")}`}
              species={sp}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProvenanceMark({ curated }: { curated: boolean }) {
  return (
    <span
      className={cn(
        "ml-1 text-[0.65rem] font-medium uppercase tracking-wide",
        curated ? "text-amber-800" : "text-muted-foreground/70",
      )}
      title={curated ? "Hand-edited (curated)" : "Seeded"}
    >
      {curated ? "curated" : "seeded"}
    </span>
  );
}

function SpeciesEditor({
  species,
}: {
  species: {
    _id: Id<"species">;
    slug: string;
    sciName: string;
    comNameEn: string;
    comNameJa: string;
    comNameZhTw: string;
    listed: boolean;
    curatedFields: string[];
    prevalence: Record<Season, number>;
    prevalenceCurated: Record<Season, boolean>;
  };
}) {
  const updateNames = useMutation(api.admin.updateNames);
  const updatePrevalence = useMutation(api.admin.updatePrevalence);
  const setListed = useMutation(api.admin.setListed);

  const [en, setEn] = useState(species.comNameEn);
  const [ja, setJa] = useState(species.comNameJa);
  const [zh, setZh] = useState(species.comNameZhTw);
  const [prev, setPrev] = useState(species.prevalence);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const curated = new Set(species.curatedFields);

  async function saveNames() {
    setSaving(true);
    setError(null);
    try {
      await updateNames({
        speciesId: species._id,
        comNameEn: en,
        comNameJa: ja,
        comNameZhTw: zh,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePrevalence() {
    setSaving(true);
    setError(null);
    try {
      await updatePrevalence({
        speciesId: species._id,
        winter: prev.winter,
        spring: prev.spring,
        summer: prev.summer,
        autumn: prev.autumn,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="border-b border-border pb-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-xl">{species.comNameEn}</h2>
          <p className="text-sm italic text-muted-foreground">{species.sciName}</p>
          <p className="font-mono text-xs text-muted-foreground">{species.slug}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={species.listed}
            onCheckedChange={(checked) => {
              void setListed({
                speciesId: species._id,
                listed: checked === true,
              });
            }}
          />
          Listed
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="EN"
          curated={curated.has("comNameEn")}
          value={en}
          onChange={setEn}
        />
        <Field
          label="JA"
          curated={curated.has("comNameJa")}
          value={ja}
          onChange={setJa}
        />
        <Field
          label="ZH-TW"
          curated={curated.has("comNameZhTw")}
          value={zh}
          onChange={setZh}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={saving} onClick={() => void saveNames()}>
          Save names
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {SEASONS.map((season) => (
          <div key={season} className="flex flex-col gap-1">
            <Label className="capitalize">
              {season}
              <ProvenanceMark curated={species.prevalenceCurated[season]} />
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={prev[season]}
              onChange={(e) =>
                setPrev((p) => ({
                  ...p,
                  [season]: Number(e.target.value),
                }))
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => void savePrevalence()}
        >
          Save Prevalence
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </article>
  );
}

function Field({
  label,
  curated,
  value,
  onChange,
}: {
  label: string;
  curated: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>
        {label}
        <ProvenanceMark curated={curated} />
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CreateSpeciesForm({ onDone }: { onDone: () => void }) {
  const createSpecies = useMutation(api.admin.createSpecies);
  const [sciName, setSciName] = useState("");
  const [en, setEn] = useState("");
  const [ja, setJa] = useState("");
  const [zh, setZh] = useState("");
  const [prev, setPrev] = useState({
    winter: 0,
    spring: 0,
    summer: 0,
    autumn: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await createSpecies({
        sciName,
        comNameEn: en,
        comNameJa: ja,
        comNameZhTw: zh,
        prevalence: prev,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 border border-border p-4">
      <p className="font-display text-lg">New Guide species</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label>Scientific name (Slug derived once)</Label>
          <Input value={sciName} onChange={(e) => setSciName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>EN</Label>
          <Input value={en} onChange={(e) => setEn(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>JA</Label>
          <Input value={ja} onChange={(e) => setJa(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>ZH-TW</Label>
          <Input value={zh} onChange={(e) => setZh(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {SEASONS.map((season) => (
          <div key={season} className="flex flex-col gap-1">
            <Label className="capitalize">{season}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={prev[season]}
              onChange={(e) =>
                setPrev((p) => ({ ...p, [season]: Number(e.target.value) }))
              }
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button disabled={saving || !sciName || !en} onClick={() => void submit()}>
          Create
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
  );
}
