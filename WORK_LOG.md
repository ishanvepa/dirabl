# Implementation checkpoints

## Editorial Figma UI — October 25, 2026

Implemented the main journal flow and first-run onboarding from the dirabl editorial Figma project. Bundled Instrument Serif, Newsreader, Inter, and the exported icons; rebuilt library, writing, reading, editing, settings, and consent surfaces with responsive native layouts. Added local name, initial reading view, and transactional onboarding completion. Existing journals skip first-run setup and can review it from Settings. Handwriting and reminders remain explicitly planned features.

Validation: TypeScript and ESLint passed; all 29 tests across 8 files passed, including five new SQLite preference and onboarding tests. Android development-app visual checks covered the populated journal, entry reading/editing, settings, consent review, writing surface, and onboarding screens. All 18 icon renders passed dimension checks. Physical-device dictation and accessibility acceptance remain in the device checklist. See [the implementation notes](docs/FIGMA_IMPLEMENTATION.md).

With explicit user approval, backed up and merged the original local journal and the journal used during design review. SQLite integrity passed; all three entries and the latest preferences were preserved. The app uses its normal `dirabl.db` database.

## Phase 1 — SQLite foundation (`cd49f0d`)

Created Expo Router, a minimal warm UI, migration v1, parameterized repositories, persistent settings and a working manual creation/library/detail loop. SQLite tests serialize/reopen a real SQLite database via sql.js, preserve literal user text and verify defaults and revision protections.

Checkpoint validation: TypeScript, ESLint and 4 tests passed. Expo SDK 58 package versions were aligned using Expo's compatibility checker. Native launch/restart remains a manual test.

## Phase 2 — On-device dictation (`2ccf68b`)

Added the genuine native adapter, locale/model checks, permission-denial handling, Android offline-model download, separate interim/final text, foreground stop, delayed-final capture, timeout retention and manual fallback. Unsaved-leave confirmation protects navigation.

Checkpoint validation: TypeScript, ESLint and 8 tests passed, including mocked native events. Real-device airplane mode and long dictation are pending. Before Finish, text remains in memory.

## Phase 3 — Backend and saved stories (`fca8802`)

Added shared Zod contracts, local Express route, strict Chat Completions output, versioned prompt, safe errors, limits, timeout/no retries, typed client, cloud consent and Story/Original Transcript views. Secrets remain server-only; public binding and production startup are disabled.

Checkpoint validation: TypeScript, ESLint and 15 tests passed. Request/output validation, normalization, metadata, refusal, incomplete output, HTTP failures and timeout were mocked. No server key was available for a live paid call.

## Phase 4 — Offline policy and reliability (`e0d1d60`)

Added bounded connectivity lookup at Finish, opt-in automatic synthesis, process-local single-use tickets, transcript editing with explicit save/cancel and stale-story notices. Tickets are created only by Finish; no reconnection listener submits entries. SQL attempt/revision guards reject stale writes. Startup resets interrupted requests to manual retry.

Checkpoint validation: TypeScript, ESLint and 23 tests passed, covering the saved offline/manual loop, auto eligibility, duplicate taps, mid-flight edits and six failure/retry cases. Physical-device demo pending.

## Phase 5 — Polish and delivery

Added keyboard avoidance, accessible controls/status, loading/empty/error states, safe navigation, formatted source, test TypeScript checking, internal EAS development profile and opt-in native local-HTTP configuration. Fixed late speech-event overwrites, coalesced overlapping stop calls, protected current stories against accidental regeneration, and verified compiled backend ESM imports. README and device checklist document exact setup and release blockers.

Final validation:

- TypeScript for app, server and tests: passed.
- ESLint: passed.
- Vitest: 24 tests across 7 files passed.
- Backend TypeScript build and compiled-module import: passed.
- Expo SDK dependency compatibility check: passed.
- Expo native config introspection: passed, including microphone/speech permissions and development local-HTTP settings.
- Android and iOS Hermes bundle export: passed. This is not native binary compilation or a device test.
- npm audit fix: compatible updates applied; 19 high-severity upstream findings remain in the Expo/Metro dependency graph. Forced SDK downgrade was not applied; see README.

No Android SDK/adb or attached phone was available, and iOS native compilation needs macOS/EAS. Real-device recognition, native persistence, long dictation, interruption and accessibility acceptance remain pending in docs/DEVICE_TESTS.md. No API credentials were present. Production also needs TLS, authentication/attestation, durable quotas/spend controls, local encryption and dependency advisory resolution. No post-MVP features were implemented.

## Yarn migration — October 24, 2026

Migrated the existing workspaces to Yarn Classic 1.22.22, matching the installed Yarn and pinning it in packageManager. Replaced package-lock.json with yarn.lock, added repository-local ignored cache configuration, switched workspace/test/start scripts and README/device-test commands to Yarn, and added the server version required by Yarn Classic. Babel 7.29.7 and Vite 8.3.5 were previously installed implicitly by npm; they are now explicit development dependencies. TypeScript is pinned to its previous 6.0.3 version. App/server dependency versions were compared against the previous npm lockfile and remain unchanged. No application source or UX changed.

Validation: Yarn install completed; a subsequent frozen offline install left yarn.lock unchanged. yarn run check passed app/server/test TypeScript checks, ESLint and all 26 tests across 8 files. The backend compiled, and both iOS and Android Hermes exports passed using Yarn workspace commands. Use yarn run check (bare yarn check is Yarn Classic's own command).

The initial import required working around npm-workspace conversion and stalled native archive downloads. A temporary local mirror reused npm's cached tarballs and was removed after Yarn installation; it is not required by the checked-in configuration. Generated caches/logs remain ignored. Physical-device testing remains pending as previously documented.

## Native EAS testing — October 24, 2026

Removed the Expo Go compatibility adapter, runtime factory, manual-only UI flags, preview commands and compatibility-selection tests. New entries initialize the native speech adapter directly. Manual typing remains available when permissions or on-device recognition are unavailable. Yarn remains the package manager; dependencies and yarn.lock are unchanged.

Added an internal EAS preview profile that bundles JavaScript for standalone iPhone testing, alongside the existing Metro-based development profile. README and the device checklist now describe registration, signing, installation, build-time backend configuration and offline restart testing through EAS.

Validation: app/server/test TypeScript checks, ESLint and all 24 tests across 7 files passed. iOS and Android Hermes bundle exports passed. No EAS cloud build or physical-device test was run; account/project setup, Apple signing and registered-device access are still required for those checks.
