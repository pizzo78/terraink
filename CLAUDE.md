# PosterEngine - Claude Code Guide

## Commands

```bash
bun install
bun run dev
bun run build
bun run typecheck
```

The dev server runs at `http://localhost:5173`.

## Architecture

Source is split into vertical feature slices under `src/features/`:

```text
src/
  features/
    export/       location/     map/          markers/
    install/      layout/       poster/       presets/
    share/        theme/        updates/      variations/
  core/
    cache/        fonts/        http/         platform/
    config.ts     services.ts
  shared/
    geo/          hooks/        ui/           utils/
  data/           styles/       types/
```

Each feature has up to four layers:

| Layer | Purpose | React allowed |
| --- | --- | --- |
| `domain/` | Pure types, port interfaces, pure logic | No |
| `application/` | Hooks that orchestrate use cases | Yes |
| `infrastructure/` | Concrete adapters and browser/API I/O | No |
| `ui/` | Components that read context and dispatch | Yes |

## Layer Rules

| Layer | May import | Must not import |
| --- | --- | --- |
| `domain/` | pure types | infrastructure, application, ui, React |
| `application/` | domain, shared, `core/config`, `core/services` | infrastructure directly |
| `infrastructure/` | domain, shared, core adapters/ports | application, ui, React |
| `ui/` | domain, application, shared/ui, shared/utils | infrastructure directly |
| `core/services.ts` | infrastructure adapters | feature UI or application hooks |

## State Management

- Single source of truth: `PosterContext` with React Context plus `useReducer`.
- `posterReducer.ts` owns `PosterState`, `PosterForm`, and `PosterAction`.
- Components call `usePosterContext()` directly.
- Side effects belong in application hooks such as `useMapSync`, `useLocationAutocomplete`, `useCurrentLocation`, `useExport`, and `useAnnouncementRelease`.

## Key Services

`src/core/services.ts` wires application-facing services:

```ts
searchLocations
geocodeLocation
reverseGeocodeCoordinates
ensureGoogleFont
compositeExport
captureMapAsCanvas
createPngBlob
createPdfBlobFromCanvas
createLayeredSvgBlobFromMap
createPosterFilename
triggerDownloadBlob
createPosterShareUrl
readPosterSharePayload
copyTextToClipboard
loadUpdateVersions
readLastSeenUpdateVersion
writeLastSeenUpdateVersion
```

## TypeScript

- New files in `src/` must be `.ts` or `.tsx`.
- `strict: false`, `allowJs: true` - gradual migration is fine.
- Use `@/` for cross-feature imports.
- Port interfaces use an `I` prefix and live in `domain/ports.ts` or `core/*/ports.ts`.

## Environment

All `VITE_*` vars are accessed only through `src/core/config.ts`. Environment values are optional for local development.

## Commit Style

Use emoji-style Conventional Commits:

```text
<emoji> <type>(<scope>): <subject>
```

Examples:

```text
fix(location): handle reverse geocode fallback
refactor(core): simplify update loading
feat(map): add zoom-to-fit button
```

One logical change per commit. Subject is lowercase, imperative, no trailing period, max 50 chars.

## Branch Strategy

```text
feature/fix branch -> dev -> beta -> main
```

Target `dev` when that branch is available. Do not open PRs directly against production branches.

## Do Not

- Add logic to `App.tsx`.
- Import from non-existent legacy paths such as `@/lib/`, `@/utils/`, `@/hooks/`, or `@/components/`.
- Duplicate utilities before checking `shared/utils/` and `shared/geo/`.
- Call `fetch()`, `localStorage`, or `new URL()` inside React components.
- Add CSS classes without matching rules in `src/styles/`.
- Prop-drill app state more than one level.
- Edit `bun.lock` manually.
