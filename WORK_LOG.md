# Implementation checkpoints

## Phase 1

Created an Expo Router application, warm minimal UI, SQLite migration v1, parameterized repository and settings storage, and manual creation/library/detail loop. Repository tests use the real SQLite engine via sql.js, including database serialization/reopen, literal user text, empty validation, settings, revisions and stale synthesis writes.

Device launch/restart remains a manual acceptance test: no attached iOS or Android device is available in this environment.

## Phase 3

Added shared Zod contracts, local Express synthesis route, strict Chat Completions schema and versioned system prompt, normalized safe errors, request limits, timeout/no retries, mobile typed client, explicit cloud consent and Story/Transcript views. API secrets are server-only. Server refuses production startup and public bind addresses. No credentials were available; live paid API smoke testing was skipped.

Validation: npm run check passed (TypeScript, ESLint, 15 tests). Tests cover request/output validation, normalization, metadata wrapping/mismatch, refusal, truncated/invalid output, rate limits, network failure and timeout.

Validation: npm run check passed (TypeScript, ESLint, 4 SQLite tests). Expo SDK 58 dependency versions aligned with expo install --fix. Native launch/restart unverified.

## Phase 2
Added native speech adapter, language/model checks, denial handling, Android download action, interim/final buffer, foreground stop, delayed final capture and timeout retention. Manual input and unsaved-leave guard remain available. npm run check passed: TypeScript, ESLint, 8 tests (including mocked native events). Real-device tests are pending in docs/DEVICE_TESTS.md; recording before Finish is memory-only.

## Phase 4
Added bounded connectivity lookup at Finish, default-off automatic synthesis with persistent consent, one-use in-memory automatic tickets (never a reconnect listener), transcript editing/cancel/leave guards and stale story notices. Existing SQL attempt/revision conditions protect edits and restart recovery never resends.
Validation: npm run check passed (TypeScript, ESLint, 23 tests), including the full persisted offline -> manual synthesis loop, online auto eligibility, one-use tickets, duplicate taps, mid-flight edits and six retryable failure cases. The physical-device demo remains pending.
