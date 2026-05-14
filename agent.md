# PosterEngine - Agent Architecture Guide

> For any AI coding agent working on this codebase.
> Read this file before writing, editing, or deleting code.

## Zero Hallucination Rule

- Do not invent file paths, exported names, types, or API shapes. Read the actual file first.
- Do not assume a function exists because it sounds reasonable. Verify with a file or symbol search.
- If you are unsure, say so and ask, or read the relevant source file before proceeding.
- If a requested feature violates the architecture in this file, warn before writing code.

## Architecture: Feature-Based + Hexagonal/Clean

The codebase is split into vertical feature slices under `src/features/`, each with four layers:

- `domain/` - pure types, interfaces, and pure logic. No React, no I/O.
- `application/` - React hooks that orchestrate use cases using domain plus `core/services`.
- `infrastructure/` - concrete adapters such as HTTP, cache, storage, parser, and browser API adapters.
- `ui/` - React components. Read state from context, dispatch actions, import application hooks.

### Feature Inventory

```text
src/features/
  export/     install/    layout/     location/
  map/        markers/    poster/     presets/
  share/      theme/      updates/    variations/
```

Cross-cutting concerns live outside features:

- `core/` - `ICache`, `IHttp`, `IFontLoader` ports and their adapters. `config.ts` for all env vars. `services.ts` wires adapters into named services consumed by application hooks.
- `shared/geo/` - geographic math and pure utilities.
- `shared/hooks/` - reusable React hooks used across features.
- `shared/ui/` - UI atoms used across features.
- `shared/utils/` - helper utilities for color, number, string, and similar pure logic.
- `data/` - static JSON data files.
- `styles/` - global CSS files. Desktop breakpoint `>980px`, mobile `<=760px`.

### Layer Import Rules

| Layer | May import | Must not import |
| --- | --- | --- |
| `domain/` | nothing, other pure types where unavoidable | infrastructure, application, ui, React |
| `application/` | domain, shared, `core/config`, `core/services` | infrastructure directly |
| `infrastructure/` | domain, shared, core adapters/ports | application, ui, React |
| `ui/` | domain, application, shared/ui, shared/utils | infrastructure directly |
| `core/services.ts` | infrastructure adapters | feature UI or application hooks |

## State Management

- Single source of truth: `PosterContext` - React Context plus `useReducer`.
- `posterReducer.ts` owns `PosterState`, `PosterForm`, and the `PosterAction` discriminated union.
- Components call `usePosterContext()` directly. Avoid prop drilling.
- Side-effect logic lives in application hooks: `useFormHandlers`, `useMapSync`, `useGeolocation`, `useLocationAutocomplete`, `useCurrentLocation`, `useExport`, `useAnnouncementRelease`.

## Key Application Hooks

| Hook | Feature | Purpose |
| --- | --- | --- |
| `useFormHandlers` | poster | form input and location handlers |
| `useMapSync` | map | bidirectional map to form sync |
| `useGeolocation` | map | browser geolocation on startup |
| `useLocationAutocomplete` | location | debounced search with stale-result guard |
| `useCurrentLocation` | location | GPS plus reverse-geocode shared handler |
| `useExport` | export | poster export orchestration |
| `usePosterPresets` | presets | quick preset application |
| `usePosterVariations` | variations | generate and apply theme/layout combinations |
| `usePosterShareLink` | share | create and copy shareable poster URLs |
| `useInstallPrompt` | install | PWA install prompt |
| `useAnnouncementRelease` | updates | update release loading and last-seen tracking |
| `useRepoStars` | shared/hooks | GitHub star count with cache |
| `useSwipeDown` | shared/hooks | mobile swipe gesture |

## Services (`src/core/services.ts`)

Pre-instantiated services. Application hooks should import I/O capabilities from here instead of instantiating adapters directly.

```ts
searchLocations
geocodeLocation
reverseGeocodeCoordinates
ensureGoogleFont
compositeExport
captureMapAsCanvas
createPngBlob
createLayeredSvgBlobFromMap
createPdfBlobFromCanvas
createPosterFilename
triggerDownloadBlob
createPosterShareUrl
readPosterSharePayload
copyTextToClipboard
loadUpdateVersions
readLastSeenUpdateVersion
writeLastSeenUpdateVersion
```

## TypeScript Rules

- All new files in `src/` must be `.ts` or `.tsx`.
- `strict: false`, `allowJs: true` - gradual migration is acceptable.
- Use the `@/` alias (`src/` root) for cross-feature imports. Avoid `../../` across feature boundaries.
- Port interfaces go in `domain/ports.ts` or `core/*/ports.ts`. Adapters implement ports and should not leak concrete types into domain or application code.
- `tsconfig.json` paths: `"@/*": ["./*"]` with `"baseUrl": "src"`.

## Naming Conventions

- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities and pure functions: `camelCase.ts`
- Port interfaces: `I` prefix, such as `ICache`, `IHttp`, `IGeocodePort`
- CSS classes: `kebab-case`

## Environment Variables

All `VITE_*` env vars are accessed only through `src/core/config.ts`. Never read `import.meta.env.*` anywhere else. Env vars are optional for local development, so do not assume they are present for core functionality. See `.env.example`.

## Branch Strategy

```text
feature/fix branch -> dev -> beta -> main
```

- `dev` - active development; PRs target this branch when available.
- `beta` - staging and pre-release testing.
- `main` - production.

## Contribution and Documentation Rules

- AI-assisted coding is allowed only when the result is reviewed, refined, and aligned with the project architecture.
- Prefer standalone modules, components, hooks, constants, and utilities over hard-coded or tightly coupled implementations.
- In Markdown files, do not place a horizontal rule immediately before a heading.
- Fenced code blocks must declare a language.

## What Not To Do

- Do not add logic to `App.tsx`; it must stay a thin shell.
- Do not import from `@/lib/`, `@/utils/`, `@/hooks/`, or `@/components/`; those directories do not exist. Use `@/shared/`.
- Do not duplicate utilities; check `shared/utils/` and `shared/geo/` first.
- Do not call `fetch()`, `localStorage`, or `new URL()` inside React components. Use application hooks plus services/adapters.
- Do not add CSS class names without a matching rule in `src/styles/`.
- Do not bypass `PosterContext` by prop-drilling state more than one level deep.
- Do not edit `bun.lock` or `package-lock.json` manually. Run the package manager.
- Do not reference exported names, types, or file paths from memory. Read the source first.
