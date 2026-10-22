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
