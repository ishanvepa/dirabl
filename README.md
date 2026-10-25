# dirabl

An offline-first iOS/Android journal built with Expo Router, TypeScript and SQLite. Speak using the phone's on-device recognizer or type. The original transcript remains the source of truth; optional cloud synthesis produces a separate story.

See the [product, UX, and technical overview](docs/APP_OVERVIEW.md) for the implemented screens, user journeys, offline behavior, architecture, privacy, and build modes.

The [Figma implementation notes](docs/FIGMA_IMPLEMENTATION.md) map the editorial UI and first-run onboarding to the source designs.

## Development

Use Node 22.16 or newer and Yarn Classic 1.22.22 (pinned in `package.json`). If Yarn is not installed, Node 22 ships Corepack: run `corepack enable`, then `corepack prepare yarn@1.22.22 --activate`. On Windows use `yarn.cmd` if PowerShell script execution is disabled.

The repository uses Yarn workspaces and a single root `yarn.lock`; install from the repository root and commit the lockfile after dependency changes. Use `yarn run check` for the full validation suite; bare `yarn check` is Yarn Classic's own command.

```sh
yarn install --frozen-lockfile
yarn run check
cp app/.env.example app/.env
```

### Test on an iPhone with EAS cloud builds

Use an Expo account, an active Apple Developer membership, and a registered iPhone (start with iOS 17+). Install the EAS CLI with `yarn global add eas-cli` if needed. From `app/`, run the one-time account/project/device setup:

```sh
eas login
eas init
eas device:create
```

Follow the registration link in Safari on your iPhone. If the CLI cannot write the EAS project ID into the dynamic app config, add the supplied ID as `extra.eas.projectId` in `app/app.config.ts`. Then build the standalone internal testing app:

```sh
eas build --platform ios --profile preview
```

Allow EAS to manage signing credentials when prompted. Open the finished build's install link on your registered iPhone. Enable Settings ? Privacy & Security ? Developer Mode, restart and confirm if prompted. The `preview` profile bundles the JavaScript inside the app, so it can launch and reopen saved entries in airplane mode without your computer or Metro. Verify offline dictation with a supported installed language model using the device checklist. Code changes require another preview build. This is an internal testing build, not a production deployment.

For fast code iteration, build the `development` profile instead:

```sh
# From app/:
eas build --platform ios --profile development
# Then from the repository root:
yarn start
```

Install that build and open the Metro QR/development URL on your phone, with the phone and computer on the same Wi-Fi. Development builds load JavaScript from Metro; use the `preview` profile for fully offline force-quit/relaunch tests. Both profiles use the same bundle identifier, so they replace each other on the phone. Avoid uninstalling the app if you want to keep its local journal; no backup/import is implemented.

Native speech recognition uses a custom native build. Manual typing remains available for denied permissions and unsupported devices/locales. Android 13+ testing and optional local native builds remain available with `yarn workspace dirabl android`; local iOS builds on macOS use `yarn workspace dirabl ios`.

Both checked-in EAS profiles allow local HTTP only for testing. Native config reads `DIRABL_ALLOW_LOCAL_HTTP`; do not carry this setting into a release profile. For optional synthesis in preview builds, set `EXPO_PUBLIC_SYNTHESIS_API_URL` in the EAS build environment (or in the preview profile's `env`) to your computer's reachable private LAN URL before building; ignored local `.env` files are not uploaded to EAS. Never place the OpenAI key in an EAS mobile-build variable. A preview build's URL is embedded and requires rebuilding to change. The backend still needs to be running and reachable for synthesis; local journaling does not.

References: [EAS internal distribution](https://docs.expo.dev/build/internal-distribution/), [iOS Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/).

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
yarn server
```

Server-only: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-6-luna`), `PORT` (3001), `HOST` (loopback by default). For a physical phone, set `HOST` to the computer's private LAN IP and `EXPO_PUBLIC_SYNTHESIS_API_URL` in `app/.env` to `http://<that-IP>:3001`. Both devices must be on the same trusted network and the firewall must allow this port. Restart Metro after changing mobile environment variables for development builds; rebuild the preview app after changing its EAS build variables. Never put an OpenAI key in `EXPO_PUBLIC_*` or the app.

The server calls Chat Completions with strict structured output and `store: false`, validates and normalizes the result, and does not log transcript/story text. `store: false` does not override provider retention policies. Manual synthesis asks for consent before sending transcript text.

This server is deliberately **local development only**: it binds to loopback/a private IP, caps requests at 6/minute/client and 100/day/process, disables SDK retries, and refuses `NODE_ENV=production`. These in-memory limits reset on restart and are not production authentication or spend controls. Do not port-forward or publish it. Public release requires TLS, authentication or attestation, durable per-user/global quotas and provider-side budget controls.

API behavior is covered by tests with mocked OpenAI responses. A live saved-entry synthesis flow was also verified on an Android emulator using an EAS development build. Native acceptance steps are in [docs/DEVICE_TESTS.md](docs/DEVICE_TESTS.md).

## Verification and remaining release work

```sh
yarn run check                                # app/server/test TypeScript, ESLint, Vitest
yarn workspace dirabl-server build         # backend compilation
yarn workspace dirabl expo install --check
yarn workspace dirabl expo export --platform android --platform ios --output-dir dist
```

Unit/integration tests use an actual SQLite engine (sql.js) and mocked native recognizer/OpenAI events. They exercise save/reopen, settings defaults, save-before-request, offline manual synthesis, auto eligibility, timeout/network/API errors, duplicate taps, mid-flight edits, stale response rejection and interrupted-request recovery. Both mobile Hermes bundles exported successfully. An EAS Android development APK was built and installed on an emulator, preserving saved entries, and a live synthesis retry succeeded. Physical-device acceptance remains pending; run every step in the device checklist before accepting the native MVP.

Recording is foreground-only, en-US. Until Finish, text is held in memory; a force-kill can lose an unfinished entry. A stop timeout retains the latest interim text, which needs review. Consecutive identical native final events are deduplicated; test intentional repetitions on target devices. Library and saved entries work without a backend, account or internet. Journal content is plain text, never interpreted as HTML.

Before public release:

- Complete real iOS/Android microphone, offline-model, airplane-mode, long-dictation, accessibility and restart tests.
- Complete synthesis acceptance testing on physical devices and review provider privacy/retention disclosure.
- Replace the development backend restriction with TLS, defensible client authentication/attestation, durable abuse limits and usage/spend controls.
- Add and verify SQLCipher encryption with platform-backed keys; SQLite here is not separately encrypted.
- Resolve upstream dependency advisories. The initial MVP audit (before the Yarn migration) reported high-severity findings propagated through Expo/Metro tooling, rooted in `braces` ([advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and `node-forge` ([advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv)). The suggested forced fix would downgrade Expo to SDK 44 and break the supported native dependency set, so it was not applied. Keep development servers on trusted networks and re-audit with `yarn audit` before release.

The editorial UI and first-run onboarding extend the Phase 5 MVP. Handwriting generation, writing-style imitation, reminders, backup/import, accounts and sync are not implemented.

API implementation references: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition), [OpenAI structured output](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).
