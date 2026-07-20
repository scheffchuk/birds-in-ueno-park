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
import { Textarea } from "@/components/ui/textarea";
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
    descriptionEn?: string;
    descriptionJa?: string;
    descriptionZhTw?: string;
    spottingTipsEn?: string;
    spottingTipsJa?: string;
    spottingTipsZhTw?: string;
    illustrationStatus:
      | "queued"
      | "generating"
      | "pendingReview"
      | "approved"
      | "failed";
    perchUrl?: string;
    flightUrl?: string;
    dimsPerch?: number[];
    dimsFlight?: number[];
  };
}) {
  const updateNames = useMutation(api.admin.updateNames);
  const updateCopy = useMutation(api.admin.updateCopy);
  const updatePrevalence = useMutation(api.admin.updatePrevalence);
  const setListed = useMutation(api.admin.setListed);

  const [en, setEn] = useState(species.comNameEn);
  const [ja, setJa] = useState(species.comNameJa);
  const [zh, setZh] = useState(species.comNameZhTw);
  const [descEn, setDescEn] = useState(species.descriptionEn ?? "");
  const [descJa, setDescJa] = useState(species.descriptionJa ?? "");
  const [descZh, setDescZh] = useState(species.descriptionZhTw ?? "");
  const [tipsEn, setTipsEn] = useState(species.spottingTipsEn ?? "");
  const [tipsJa, setTipsJa] = useState(species.spottingTipsJa ?? "");
  const [tipsZh, setTipsZh] = useState(species.spottingTipsZhTw ?? "");
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

  async function saveCopy() {
    setSaving(true);
    setError(null);
    try {
      await updateCopy({
        speciesId: species._id,
        descriptionEn: descEn,
        descriptionJa: descJa,
        descriptionZhTw: descZh,
        spottingTipsEn: tipsEn,
        spottingTipsJa: tipsJa,
        spottingTipsZhTw: tipsZh,
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
          <p className="text-xs text-muted-foreground">
            Illustration: {species.illustrationStatus}
          </p>
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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TextField
          label="Description EN"
          curated={curated.has("descriptionEn")}
          value={descEn}
          onChange={setDescEn}
        />
        <TextField
          label="Description JA"
          curated={curated.has("descriptionJa")}
          value={descJa}
          onChange={setDescJa}
        />
        <TextField
          label="Description ZH-TW"
          curated={curated.has("descriptionZhTw")}
          value={descZh}
          onChange={setDescZh}
        />
        <TextField
          label="Tips EN"
          curated={curated.has("spottingTipsEn")}
          value={tipsEn}
          onChange={setTipsEn}
        />
        <TextField
          label="Tips JA"
          curated={curated.has("spottingTipsJa")}
          value={tipsJa}
          onChange={setTipsJa}
        />
        <TextField
          label="Tips ZH-TW"
          curated={curated.has("spottingTipsZhTw")}
          value={tipsZh}
          onChange={setTipsZh}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => void saveCopy()}
        >
          Save copy
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

      <IllustrationControls species={species} />
    </article>
  );
}

function IllustrationControls({
  species,
}: {
  species: {
    _id: Id<"species">;
    illustrationStatus: string;
    perchUrl?: string;
    flightUrl?: string;
    dimsPerch?: number[];
    dimsFlight?: number[];
  };
}) {
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl);
  const attachIllustrations = useMutation(api.admin.attachIllustrations);
  const approveIllustrations = useMutation(api.admin.approveIllustrations);
  const rejectIllustrations = useMutation(api.admin.rejectIllustrations);
  const startIllustrationRegen = useMutation(api.admin.startIllustrationRegen);

  const [perchFile, setPerchFile] = useState<File | null>(null);
  const [flightFile, setFlightFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<{
    storageId: Id<"_storage">;
    dims: number[];
  }> {
    const uploadUrl = await generateUploadUrl({});
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!result.ok) throw new Error(`Upload failed (${result.status})`);
    const json = (await result.json()) as { storageId: Id<"_storage"> };
    const dims = await readImageDims(file);
    return { storageId: json.storageId, dims };
  }

  async function attach() {
    if (!perchFile || !flightFile) {
      setError("Choose both perched and flight cutouts");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const perch = await upload(perchFile);
      const flight = await upload(flightFile);
      await attachIllustrations({
        speciesId: species._id,
        illustrationPerch: perch.storageId,
        illustrationFlight: flight.storageId,
        dimsPerch: perch.dims,
        dimsFlight: flight.dims,
      });
      setPerchFile(null);
      setFlightFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Attach failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-sm font-medium">Illustrations (pair)</p>
      <div className="flex flex-wrap gap-4">
        {species.perchUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={species.perchUrl}
            alt="Perch preview"
            className="h-24 w-auto object-contain"
          />
        ) : null}
        {species.flightUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={species.flightUrl}
            alt="Flight preview"
            className="h-24 w-auto object-contain"
          />
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label>Perched cutout</Label>
          <Input
            type="file"
            accept="image/png,image/webp"
            onChange={(e) => setPerchFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Flight cutout</Label>
          <Input
            type="file"
            accept="image/png,image/webp"
            onChange={(e) => setFlightFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void attach()}>
          Attach pair
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || species.illustrationStatus !== "pendingReview"}
          onClick={() => void approveIllustrations({ speciesId: species._id })}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || species.illustrationStatus !== "pendingReview"}
          onClick={() => void rejectIllustrations({ speciesId: species._id })}
        >
          Reject
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={busy || species.illustrationStatus !== "approved"}
          onClick={() =>
            void startIllustrationRegen({ speciesId: species._id })
          }
        >
          Start regen
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

function readImageDims(file: File): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const long = Math.max(img.naturalWidth, img.naturalHeight);
      const scale = long > 0 ? 560 / long : 1;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      URL.revokeObjectURL(url);
      resolve([w, h]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
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

function TextField({
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
      <Textarea
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
      />
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
