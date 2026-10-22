# dirabl

An offline-first iOS/Android journal built with Expo Router, TypeScript and SQLite. Speak using the phone's on-device recognizer or type. The original transcript remains the source of truth; optional cloud synthesis produces a separate story.

## Development

Use Node 22.16 or newer and npm. On Windows use `npm.cmd` / `npx.cmd` if PowerShell script execution is disabled.

```sh
npm install
npm run check
npm run android -w app
# macOS + Xcode:
npm run ios -w app
npm start
```

Native speech recognition requires an Expo **development build**, not Expo Go. Android development needs an Android SDK/JDK and an emulator or USB-debugging phone. iOS builds need macOS/Xcode or EAS Build. Prefer a real iOS 17+ / Android 13+ phone for speech acceptance tests.

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
