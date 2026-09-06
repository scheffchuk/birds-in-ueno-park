# Atlas audio operations

This guide covers the local workflow for selecting xeno-canto recordings, reviewing the committed manifest, and synchronizing media and attribution metadata to Convex. Selection and synchronization are operator-run commands; builds and visitor requests never call xeno-canto, eBird, or Wikidata.

## 1. Verify the xeno-canto account and configure local keys

1. Create or sign in to an account at [xeno-canto](https://xeno-canto.org/).
2. Verify the email address for the account.
3. Open the [xeno-canto account page](https://xeno-canto.org/account), create or copy the API key, and keep it private. API v3 requests require this key; the [API reference](https://xeno-canto.org/explore/api) is useful when investigating an upstream response.
4. Put the key in the ignored `.env.local` file at the repository root:

   ```dotenv
   XENO_CANTO_API_KEY=<xeno-canto-api-key>
   ```

   Never commit the key, put it in `data/audio-manifest.json`, pass it in a URL, or expose it through a browser or Convex environment variable.

5. Optionally add an eBird API key for direct species-link enrichment:

   ```dotenv
   EBIRD_API_KEY=<ebird-api-key>
   ```

   Without it, selection preserves existing eBird links and continues without enrichment. Wikipedia links are resolved through Wikidata during selection.

## 2. Select recordings locally

Run selection from the repository root:

```bash
pnpm audio:select
```

The command searches by exact scientific name, rejects uncertain identities and unsupported licences, downloads the complete selected source file, and writes `data/audio-manifest.json`. Audio files are staged under ignored `data/audio/`; they are not source-controlled.

Successful available entries in the existing manifest are pinned by default. A normal run preserves those selections even when upstream ranking changes. An explicit refresh recomputes selections and enrichment for review:

```bash
pnpm audio:select -- --refresh
```

If selection fails, the command prints an incomplete-progress report with the
completed count, selected and unavailable counts, downloaded bytes, each
failed species and stage, and a retry command. The manifest is left unchanged;
do not run synchronization from a failed selection. Fix the reported upstream
or local problem, retry normally to continue with pinned entries, and use
`pnpm audio:select -- --refresh` only when the intended recovery is to
recompute selections. Review the resulting diff again after a successful run.

An unavailable entry is intentional coverage: it keeps the Guide species in the Atlas and records the reason. Normal runs can retry an unavailable entry; do not remove it from the manifest to hide the gap.

## 3. Review the manifest before synchronization

Treat the manifest as the review checkpoint. Inspect the diff and confirm:

```bash
git diff -- data/audio-manifest.json
```

- every current Guide species has exactly one entry;
- each available entry has the expected species, xeno-canto catalogue number, recordist, source URL, exact licence name and URL, duration, byte count, and SHA-256 hash;
- the source URL is the recording provenance page, not only the download URL;
- `nonCommercial: true` is understood before publishing—the current site is educational and noncommercial, and those recordings need replacement before any revenue-generating use;
- eBird and Locale-specific Wikipedia links point to the intended species; and
- unavailable entries retain a useful reason and do not disappear from the list.

Do not edit an available entry's source or licence fields to make it look different from xeno-canto. To choose a different recording, run an explicit refresh, review the complete diff, and keep the resulting source metadata together.

The About page is the visitor-facing attribution check: it lists the Guide species, recordist, xeno-canto catalogue number, source recording, exact licence, and safe external links. The Atlas card only exposes playback and reference controls; it does not repeat per-recording attribution.

## 4. Configure and sync development

Ensure the Convex development deployment is running and has the same secret as local `.env.local`:

```dotenv
NEXT_PUBLIC_CONVEX_URL=<development-convex-url>
AUDIO_SYNC_SECRET=<local-sync-secret>
```

Set `AUDIO_SYNC_SECRET` to the same value in the development Convex deployment. Then sync the reviewed manifest:

```bash
pnpm audio:sync
```

This command always targets `NEXT_PUBLIC_CONVEX_URL` unless `--prod` is explicitly supplied. It refuses missing URLs and refuses a development/production URL collision. For every available file it verifies the local byte count and hash before upload; an unchanged hash reuses the existing Convex Storage object. A replacement updates the species metadata before deleting the superseded object. If a metadata commit fails, the newly uploaded unreferenced object is cleaned up when possible.

The report prints each species outcome and byte count, followed by uploaded, skipped, unavailable, and total bytes. A successful sync should be checked in the development Atlas:

1. Open each Season represented in the manifest and confirm cards still render when audio is unavailable.
2. Play, pause, resume, and switch between two cards; confirm only one recording plays.
3. Confirm Wikipedia follows the active Locale with English fallback and eBird opens the direct species page.
4. Open the localized About page and follow its Audio credits link from the footer.

The repository's automated browser check uses a dev-only fixture and stubs media playback, Convex, Wikipedia, eBird, xeno-canto, and live audio delivery. It never consumes a real recording:

```bash
pnpm exec playwright install chromium  # once per machine
pnpm test:all
```

## 5. Sync production explicitly

Production is a separate operator action. First complete the manifest review, development sync, and the full verification commands:

```bash
pnpm lint
pnpm typecheck
pnpm test:all
pnpm build
```

Set a distinct production URL and ensure the production Convex deployment has the same `AUDIO_SYNC_SECRET`:

```dotenv
CONVEX_PROD_URL=<production-convex-url>
```

Then run the only production sync command:

```bash
pnpm audio:sync -- --prod
```

Record the sync report in the deployment change notes. Verify one available, one unavailable, and one Locale-specific entry in production, then verify Audio credits and the footer link. Never set `CONVEX_PROD_URL` equal to the development URL and never rely on production being inferred from the environment.

## 6. Attribution, unavailable media, and usage monitoring

- Licences belong to individual recordings. Preserve the exact licence URL and licence label from xeno-canto. A `CC BY-NC*` recording is marked `nonCommercial`; it is suitable for the current noncommercial site only.
- A species with unavailable audio remains a Listed Guide species. The Atlas shows a disabled, localized “Audio unavailable” control and does not create a false credit.
- Pinned selections are the available entries already present in the manifest. Normal selection protects them; `--refresh` is the deliberate replacement path.
- `preload="none"` and the first-click player keep ordinary Atlas browsing from downloading the recording. Playback still creates Convex Storage file traffic when a visitor listens.
- Review the deployment's [Convex dashboard](https://dashboard.convex.dev/) usage and logs after a sync and after release. Track file storage and data egress, especially `storage_api_bandwidth` events for direct file downloads. Range requests, partial downloads, and browser retries can produce multiple egress events for one apparent listen; compare trends rather than treating the manifest's total bytes as total egress.
- If usage rises unexpectedly, inspect the Atlas for repeated loads, confirm audio URLs are not rendered as preloads, and use Convex usage limits as a guardrail. The project does not enforce a hard storage budget in the sync command.
