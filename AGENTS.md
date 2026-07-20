# Birds in Ueno

## Package manager

Use **pnpm** only (`pnpm install`, `pnpm add`, `pnpm exec`, `pnpm dlx`, …). Do not use npm or yarn.

## UI

Use **shadcn/ui** primitives (`pnpm dlx shadcn@latest add …`) for interactive UI. Compose with existing components before custom markup.

## Agent skills

### Issue tracker

GitHub Issues via the `gh` CLI (`scheffchuk/birds-in-ueno-park`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
