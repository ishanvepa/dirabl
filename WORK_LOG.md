# Implementation checkpoints

## Phase 1

Created an Expo Router application, warm minimal UI, SQLite migration v1, parameterized repository and settings storage, and manual creation/library/detail loop. Repository tests use the real SQLite engine via sql.js, including database serialization/reopen, literal user text, empty validation, settings, revisions and stale synthesis writes.

Device launch/restart remains a manual acceptance test: no attached iOS or Android device is available in this environment.

Validation: npm run check passed (TypeScript, ESLint, 4 SQLite tests). Expo SDK 58 dependency versions aligned with expo install --fix. Native launch/restart unverified.

## Phase 2
Added native speech adapter, language/model checks, denial handling, Android download action, interim/final buffer, foreground stop, delayed final capture and timeout retention. Manual input and unsaved-leave guard remain available. npm run check passed: TypeScript, ESLint, 8 tests (including mocked native events). Real-device tests are pending in docs/DEVICE_TESTS.md; recording before Finish is memory-only.
