# dirabl

An offline-first iOS/Android journal built with Expo Router, TypeScript and SQLite. Speak using the phone's on-device recognizer or type. The original transcript remains the source of truth; optional cloud synthesis produces a separate story.

## Development

Use Node 22.16 or newer and npm. On Windows use `npm.cmd` / `npx.cmd` if PowerShell script execution is disabled.

```sh
npm install
npm run check
cp app/.env.example app/.env
# Edit the backend URL if using AI; DIRABL_ALLOW_LOCAL_HTTP=1 is only for development.
npm run android -w app
# macOS + Xcode:
npm run ios -w app
npm start
```

Native speech recognition requires an Expo **development build**, not Expo Go. Android development needs an Android SDK/JDK and an emulator or USB-debugging phone. iOS builds need macOS/Xcode or EAS Build. Prefer a real iOS 17+ / Android 13+ phone for speech acceptance tests.

### Quick preview in Expo Go

From the repository root, run `npm run start:go` (or `npm.cmd run start:go` in PowerShell), then scan the QR code with your phone. Install an Expo Go version compatible with this project's Expo SDK 58. No custom native build is required for this mode.

Expo Go uses manual text entry. New Entry hides microphone/model-download/settings controls and explains that voice dictation requires the development build. Library, local persistence, transcript editing, consent and optional backend synthesis use the same code. No new dependencies or second app project are needed. The speech module is loaded only outside Expo Go.

Expo Go and the standalone dirabl development app have separate journal storage. Custom native network settings do not change Expo Go; if synthesis cannot reach your local backend, verify LAN access and the host app's network permissions. Expo Go is a preview, not validation of native speech or release/offline cold-start behavior. Use `npm start` for the full development build.

For EAS on a machine without native build tools, run from `app/`:

```sh
npx eas-cli build:configure
npx eas-cli build --profile development --platform android
# Or --platform ios, with Apple signing credentials and a registered device.
```

An Expo account and native signing setup are required. Install the resulting development build, then run `npm start` from the repository root and open its Metro development URL on the phone. The checked-in EAS profile is for internal development only. Its local HTTP permission must not be used for a release build. Native config reads `DIRABL_ALLOW_LOCAL_HTTP`; changing it requires rebuilding, not just restarting Metro.

## Persistence smoke test

Launch with networking disabled, create an entry using manual text, Finish, return to My Journal, reopen it. Force-stop and relaunch the app, then reopen the same entry. The text must remain unchanged. Automated repository tests also serialize and reopen a real SQLite database through sql.js; these do not replace testing Expo's native storage on a phone.

## Architecture

`app/app` contains routes. `app/src/services/database` owns migrations, parameterized writes, settings and revision/attempt protection. Screens use repositories rather than SQL. Synthesis state and recording state are separate. The server is a separate workspace; secrets never belong in the mobile app.

Post-MVP handwriting, writing-style personalization and backup/import are intentionally excluded.

## Optional AI synthesis backend

```sh
cp server/.env.example server/.env
cp app/.env.example app/.env
# Edit both files, then:
npm run server
```

Server-only: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-6-luna`), `PORT` (3001), `HOST` (loopback by default). For a physical phone, set `HOST` to the computer's private LAN IP and `EXPO_PUBLIC_SYNTHESIS_API_URL` in `app/.env` to `http://<that-IP>:3001`. Both devices must be on the same trusted network and the firewall must allow this port. Restart Metro after changing mobile environment variables. Never put an OpenAI key in `EXPO_PUBLIC_*` or the app.

The server calls Chat Completions with strict structured output and `store: false`, validates and normalizes the result, and does not log transcript/story text. `store: false` does not override provider retention policies. Manual synthesis asks for consent before sending transcript text.

This server is deliberately **local development only**: it binds to loopback/a private IP, caps requests at 6/minute/client and 100/day/process, disables SDK retries, and refuses `NODE_ENV=production`. These in-memory limits reset on restart and are not production authentication or spend controls. Do not port-forward or publish it. Public release requires TLS, authentication or attestation, durable per-user/global quotas and provider-side budget controls.

API behavior was verified with mocked OpenAI responses; no server API key was available for a paid smoke test. Native acceptance steps are in [docs/DEVICE_TESTS.md](docs/DEVICE_TESTS.md).

## Verification and remaining release work

```sh
npm run check                  # app/server/test TypeScript, ESLint, Vitest
npm run build -w server        # backend compilation
npm exec -w app -- expo install --check
npm exec -w app -- expo export --platform android --platform ios --output-dir dist
```

Unit/integration tests use an actual SQLite engine (sql.js) and mocked native recognizer/OpenAI events. They exercise save/reopen, settings defaults, save-before-request, offline manual synthesis, auto eligibility, timeout/network/API errors, duplicate taps, mid-flight edits, stale response rejection and interrupted-request recovery. Both mobile Hermes bundles exported successfully. No physical-device or native binary build has been verified here; run every step in the device checklist before accepting the native MVP.

Recording is foreground-only, en-US. Until Finish, text is held in memory; a force-kill can lose an unfinished entry. A stop timeout retains the latest interim text, which needs review. Consecutive identical native final events are deduplicated; test intentional repetitions on target devices. Library and saved entries work without a backend, account or internet. Journal content is plain text, never interpreted as HTML.

Before public release:

- Complete real iOS/Android microphone, offline-model, airplane-mode, long-dictation, accessibility and restart tests.
- Run a real-key smoke test with the configured model and review provider privacy/retention disclosure.
- Replace the development backend restriction with TLS, defensible client authentication/attestation, durable abuse limits and usage/spend controls.
- Add and verify SQLCipher encryption with platform-backed keys; SQLite here is not separately encrypted.
- Resolve upstream dependency advisories. After `npm audit fix`, npm reports 19 high-severity findings propagated through Expo/Metro tooling, rooted in `braces` ([advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and `node-forge` ([advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). npm's suggested forced fix downgrades Expo to SDK 44 and breaks the supported native dependency set; it was not applied. Keep development servers on trusted networks and re-audit before release.

The implementation stops at Phase 5. HandFonted, writing-style imitation, backup/import, accounts and sync are not implemented.

API implementation references: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition), [OpenAI structured output](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).
