# HappyGolf GO — member mobile app

Expo React Native app (Android + iOS) for golf members: reservations, tickets,
lesson logs, homework, activity sharing, and notifications.

## Requirements

- Node `>=22.13.0` (Expo's requirement, recorded in `AGENTS.md`; manage with nvm)
- pnpm `10.26.0` (pinned in `package.json` and `eas.json`)
- Xcode for iOS builds, Android Studio for Android builds

Use pnpm only. Do not add npm or Yarn lockfiles.

## Setup

```bash
pnpm install
cp .env.example .env
```

`.env` must define:

| Variable | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | yes | Member API root, e.g. `http://localhost:8082/api/v1` |
| `EXPO_PUBLIC_AUTH_BASE_URL` | yes | Better Auth base URL, e.g. `http://localhost:3002/api/member/auth` |
| `EXPO_PUBLIC_APP_VERSION_URL` | no | Defaults to `${EXPO_PUBLIC_API_BASE_URL}/app/version` |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | no | Defaults to `local` |
| `EXPO_PUBLIC_SENTRY_DSN` | no | No fallback: unset disables crash reporting. Set it in the EAS preview/production environments |

The app uses native modules (`@expo/ui`, notifications, video, secure store), so
**it needs a development build. Expo Go cannot run it.**

```bash
# First build on a device or simulator (creates the dev client)
pnpm android
pnpm ios

# Day-to-day development
pnpm start --dev-client
```

EAS profiles live in `eas.json` (`development`, `development-simulator`,
`preview`, `production`). See `docs/build-and-run.md` for the full build and
credential workflow.

## Checks

Run these before opening a pull request; CI runs the same four:

```bash
pnpm exec prettier --check .
pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm test
```

Format the codebase with `pnpm format` (Prettier, 4-space, 120 columns).
Prettier and ESLint are wired together through `eslint-config-prettier`, so
ESLint never fights the formatter.

`pnpm test` runs `scripts/startup-compat.test.cjs` plus every
`scripts/tests/*.test.cjs`. These are fast Node tests for pure logic, query
invariants, and screen wiring. They are not a substitute for device testing:
runtime and visual behavior is verified manually with `docs/qa-checklist.md`.

Optional: `pnpm dlx expo-doctor` for config/dependency drift, and
`pnpm exec expo export --platform android --platform ios --output-dir dist` to
verify both bundles compile.

## Project layout

```text
src/app/            Expo Router routes (tabs, stacks, modals)
src/components/     Feature components (golf domain)
src/design-system/  Theme, tokens, Screen, buttons, lists, charts
src/lib/hook/       TanStack Query hooks and app hooks
src/lib/client/     API client, JWT cache, request headers
src/service/        Typed API service functions
src/types/          API and domain types
src/i18n/           en, ko, ja, zh, km resources
scripts/            Node checks and QA helpers
docs/               Architecture, build, theming, audit, and QA docs
```

Screens render state; hooks own query keys and caching; services call the API.
Server data is read straight from React Query, never copied into local state.

## Documentation

- `AGENTS.md` — architecture, UI, and data rules enforced in review
- `docs/mobile-app-reference-guide.md` — how each feature is built, plus playbook
- `docs/build-and-run.md`, `docs/local-development.md` — local setup and builds
- `docs/app-theme.md`, `docs/native-ui-gotchas.md` — theme tokens and native layout pitfalls
- `docs/qa-checklist.md` — manual device checklist
- `docs/mobile-app-versioning.md`, `docs/production-environment.md` — release operations

## License

See `LICENSE`.
