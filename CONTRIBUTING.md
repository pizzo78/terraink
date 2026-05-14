# Contributing to PosterEngine

This guide keeps contributions focused, reviewable, and consistent with the app architecture.

## Getting Started

```bash
git clone https://github.com/pizzo78/terraink.git
cd terraink
bun install
bun run dev
```

The app runs at `http://localhost:5173`.

Environment variables are optional for local development. Check [`.env.example`](./.env.example) for available entries. Do not assume environment values are present for core functionality, and access `VITE_*` values only through `src/core/config.ts`.

## Branch Strategy

The intended promotion model is:

```text
dev -> beta -> main
```

When `dev` is available, create feature branches from `dev` and target pull requests back to `dev`. Do not open production changes directly against `main`.

## Contribution Flow

1. Pick an existing issue, or open one to discuss substantial changes.
2. Create a short descriptive branch such as `fix/geocoding-error` or `feat/svg-export`.
3. Implement a focused diff.
4. Run `bun install` if dependencies changed.
5. Run `bun run build` before opening a PR.
6. Add screenshots or a short demo for visible UI changes.

## Code Quality

- Read [agent.md](./agent.md) before changing code.
- Keep `App.tsx` as a thin shell.
- Respect the feature layers: domain, application, infrastructure, and UI.
- Put browser/API/storage I/O in infrastructure adapters, then expose it through application hooks or `core/services.ts`.
- Reuse existing shared utilities before adding new ones.
- Prefer named constants, configuration, or reusable helpers over hard-coded values.
- Keep CSS class names matched by rules in `src/styles/`.
- Use the `@/` alias for cross-feature imports.
- Do not edit `bun.lock` manually.

## Commit Messages

Follow the repository commit message convention documented in [`.vscode/commit-instructions.md`](./.vscode/commit-instructions.md).

Keep commits focused: one logical change per commit, lowercase imperative subject, no trailing period.

## AI-Assisted Contributions

AI-assisted coding is allowed when the result is reviewed, refined, and aligned with the architecture. Do not submit generated output that contains unverified paths, hard-coded assumptions, incomplete UX, or weak abstractions.

## Contributor License Agreement

This project requires agreement to the [Contributor License Agreement](./CLA.md) for code contributions. By submitting a pull request, you agree to its terms.

The project is licensed under AGPL-3.0 for new changes. See [LICENSE](./LICENSE) for details.
