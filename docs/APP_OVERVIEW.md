# dirabl: product, UX, and technical overview

This document describes the implemented MVP as of October 25, 2026.

## 1. What the app does

dirabl is a mobile journal for iOS and Android. A person can speak or type an entry, save it on their device, and optionally turn the saved transcript into a polished journal story using AI.

Each entry can contain two versions of the writing:

- **Original Transcript:** the saved text produced by dictation or manual typing. The user can edit this text later.
- **Story:** a separate AI-generated version, accompanied by a title and three to six tags.

The original transcript is the source of truth. Synthesis adds a story to the entry while preserving the transcript. Saving and reading journal entries work independently of the AI service.

The app has no journal account or sign-in flow. Its journal database lives on the device. First-run onboarding introduces the journal and collects optional local preferences; the [Figma implementation notes](FIGMA_IMPLEMENTATION.md) describe the editorial UI and onboarding design.

## 2. Main user journey

1. Open **My Journal**.
2. Tap **New Entry**.
3. Type into the transcript editor or tap **Start Dictating**.
4. Review the text and tap **Finish Entry**.
5. The app saves the transcript and timestamps to the local database.
6. The app opens the saved entry.
7. The user can request synthesis manually. If automatic synthesis is enabled, a newly finished entry that was saved online can be synthesized automatically.
8. A successful result adds a title, story, and tags. The user can switch between the story and original transcript.

```text
Speak or type
     |
Finish Entry
     |
Save original transcript to SQLite
     |
Open saved entry
     |
Optional synthesis: app -> dirabl backend -> OpenAI
     |
Save generated title, story, and tags to the same local entry
```

An unsuccessful synthesis request leaves the saved transcript available for reading, editing, and retrying.

## 3. Screens and navigation

| Screen               | Route         | Purpose                                                                                        |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| My Journal           | `/`           | Browse saved entries and start a new entry.                                                    |
| New Entry            | `/new`        | Dictate or type, then finish and save.                                                         |
| Journal Entry        | `/entry/[id]` | Read the transcript or story, edit the transcript, and request synthesis.                      |
| Privacy & Settings   | `/settings`   | Read the privacy disclosure and manage automatic synthesis and consent.                        |
| First-run onboarding | `/onboarding` | Set a local name, reading preference, and explicit AI choices before entering a fresh journal. |

### My Journal

The library lists entries newest first. Each card shows the creation date and time, a title or **Untitled Entry**, a three-line preview, and the synthesis status. The preview uses the generated story when one exists; otherwise it uses the transcript.

The screen includes **New Entry** and **Privacy & Settings** buttons. An empty journal shows an introduction and a **Start Journaling** button. Loading and database failures have visible states and a retry action.

The library reloads from SQLite when it receives focus, so returning from a saved or updated entry refreshes the list.

### New Entry

The writing screen opens with **What's on your mind?** and explains that dictation stays on the device.

The user can type directly into a multiline editor. If the device supports the installed offline English speech model, **Start Dictating** starts live recognition. The app shows a listening notice, committed transcript text, and separate interim text in italics.

Typing is disabled while recognition is active or the entry is being saved. **Finish Entry** stops active dictation, retains the available text, saves the entry, and opens its detail screen. Empty entries cannot be saved.

If local recognition is unavailable, the screen explains the problem and keeps manual typing available. It can offer an Android offline-model download and includes a button to open the app's device settings.

Leaving an unfinished entry asks whether to keep writing or discard it. Unfinished text is held in memory until Finish; there is no incremental draft autosave.

### Journal Entry

The detail screen shows the title, creation timestamp, tags when available, and a synthesis status notice.

**Story** and **Original** form a segmented control that selects the displayed version. The saved reading preference determines the initial view when a story exists. An entry without a story opens on the transcript.

The screen offers **Synthesize Entry** or **Retry Synthesis** when the entry has no story or its story is stale. The action is disabled while offline, editing, or already synthesizing. Loading indicators and inline errors explain request progress and failure.

**Edit Original Transcript** opens a multiline editor with **Save Transcript** and **Cancel Edits**. Unsaved changes are protected by discard confirmations. The generated title, tags, and story do not have their own editing controls in the current UI.

### Privacy & Settings

The settings screen explains what synthesis sends to the backend and OpenAI. It provides:

- An **Automatic online synthesis** switch, initially off.
- A consent prompt before enabling automatic synthesis or making the first manual synthesis request.
- An action to turn off automatic synthesis and reset consent.
- A disclosure about local SQLite storage and its encryption limitations.

Consent and automatic-synthesis preferences are stored locally. Settings also includes an optional journal name, the preferred reading view, and a link to review onboarding. Fresh journals start with automatic synthesis off; existing journals retain their data when onboarding is introduced.

## 4. Visual and interaction design

The interface follows the editorial Figma concept with a warm canvas, dark text, forest-green cards, lime actions, and light neutral notices. Instrument Serif supplies headings, Newsreader supplies journal text, and Inter supplies controls and metadata. The fonts and design icons are bundled locally.

| Element         | Current treatment                                                                        |
| --------------- | ---------------------------------------------------------------------------------------- |
| Background      | Warm canvas, `#F8F8F2`.                                                                  |
| Main text       | Dark ink, `#1B241D`.                                                                     |
| Secondary text  | Muted gray-green, `#73786F`.                                                             |
| Primary actions | Lime, `#D5FA72`, with dark text; dark primary actions use white text.                    |
| Borders         | Light neutral, `#DEE1D8`.                                                                |
| Notices         | Soft green, `#EEF4E6`, or quiet neutral, `#F2F3EA`.                                      |
| Headings        | Instrument Serif, generally size 41-55 depending on the screen.                          |
| Body text       | Newsreader for journal text, generally size 20 with line height 29; Inter for UI copy.   |
| Buttons         | Rounded corners and minimum height 56.                                                   |
| Screen layout   | Scrollable content with horizontal padding 24 and fixed action footers where applicable. |

Shared components provide consistent headings, body text, buttons, notices, and loading indicators. Screens use keyboard avoidance; editable fields and important controls have accessibility labels. Notices and interim transcription use polite live announcements where configured. Library cards expose button semantics.

These accessibility measures are implemented; full screen-reader, large-text, and physical-device acceptance testing remains necessary.

## 5. Offline behavior and user control

| Situation                                                  | Behavior                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Reading saved entries without internet                     | Entries load from the local database.                                                         |
| Typing and finishing an entry offline                      | The transcript is saved locally.                                                              |
| Dictating offline                                          | Available when the device supports on-device recognition and has the required language model. |
| First use without an offline speech model                  | Manual typing remains available; downloading a model may require connectivity.                |
| Requesting AI synthesis                                    | Requires a reachable backend and the backend's connection to OpenAI.                          |
| Saving online with automatic synthesis off                 | The entry is saved and awaits a manual synthesis action.                                      |
| Saving online with consent and automatic synthesis enabled | The newly finished entry can be synthesized automatically.                                    |
| Connectivity returns after an offline save                 | The entry remains available for manual synthesis; reconnecting does not submit it.            |
| Synthesis fails                                            | The transcript remains saved and the user can retry.                                          |

Connectivity is a hint rather than a guarantee that the backend is reachable. The app checks connectivity at Finish with a 1.5-second timeout and handles request failures separately.

Automatic synthesis uses a single-use ticket created only when an eligible entry is finished. Tickets live in memory and are consumed by the entry screen. They are not reconstructed on app restart, and there is no background submission queue.

## 6. Speech recognition

Speech recognition runs through an adapter around `expo-speech-recognition`. The current UI requests the `en-US` locale.

Before starting, the adapter checks recognition availability, on-device support, installed language models, permissions, and foreground app state. Recognition explicitly requests:

- On-device processing.
- Interim results.
- Continuous recognition where supported by the platform.
- Punctuation.
- No persisted audio recording.

Committed text and interim text are buffered separately. Interim results replace the current partial text. Final segments are appended with logic to suppress repeated native final events.

Finish waits for recognition to end, with a two-second stop timeout. The latest available partial text is retained if a final result never arrives. Late recognition events are ignored after finalization. Repeated stop requests share the same pending stop operation.

Dictation is foreground-only. Moving the app into the background stops recognition. The app does not retain audio files or provide cloud transcription as a fallback.

Actual recognition quality and offline availability depend on the device, operating system, speech service, and installed language model. Long dictation and intentional repeated phrases still require device testing.

## 7. AI synthesis behavior

The mobile app sends the saved transcript to the dirabl backend. The backend uses OpenAI Chat Completions with strict structured output.

The editing prompt asks the model to preserve the person's meaning, uncertainty, factual details, tone, and vocabulary while removing unnecessary filler and accidental repetition. It asks for a first-person story, natural title, and relevant tags, and instructs the model to avoid inventing events or feelings.

The transcript is treated as source material. The prompt instructs the model to disregard instructions inside that material that attempt to change its behavior or output format. Generated text still needs user review for accuracy.

The current server default is `gpt-6-luna`, configurable through `OPENAI_MODEL`. Requests use `store: false`, a 25-second provider timeout, no SDK retries, and a maximum of 6,000 completion tokens. The mobile client has a 35-second request timeout.

The backend trims output, removes empty or duplicate tags, and validates the result before returning it. The mobile client validates it again before saving.

### Content limits

| Field                         | Validation                                          |
| ----------------------------- | --------------------------------------------------- |
| Transcript sent for synthesis | Nonempty after trimming; maximum 30,000 characters. |
| Generated title               | 1-160 characters after trimming.                    |
| Generated story               | 1-40,000 characters after trimming.                 |
| Tags                          | 3-6 unique normalized values; each 1-40 characters. |

The local editor does not enforce the same 30,000-character synthesis limit. A longer entry can therefore be saved locally and rejected when synthesis is requested.

## 8. Synthesis states and editing

| Stored state          | User-facing meaning                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `transcribed_offline` | Saved offline and awaiting manual synthesis. This state also applies to typed entries saved offline. |
| `ready_to_synthesize` | The transcript is saved and eligible for synthesis.                                                  |
| `synthesizing`        | A synthesis attempt is in progress.                                                                  |
| `synthesized`         | A story has been saved; the UI shows **Story ready**.                                                |
| `synthesis_failed`    | The attempt failed and can be retried.                                                               |

Recording state and synthesis state are separate. An entry can be saved successfully even when the AI service is unavailable.

Changing a saved transcript increments its revision. The existing generated story is retained, and a notice explains that it comes from an earlier transcript. The user can synthesize again to update the story, title, and tags. Editing does not create a separate browsable history of transcript versions.

Each synthesis attempt has its own identifier and transcript revision. A result is saved only when its entry, attempt, and revision still match the current record. This prevents an old response from overwriting work after an edit. UI guards, an in-memory active-request set, and database conditions limit duplicate attempts.

On startup, entries left in `synthesizing` after an interruption become retryable failures. Startup does not resend their text automatically.

## 9. Technical architecture

The repository is a Yarn workspace containing a mobile app, a separate backend, and shared data contracts.

| Layer             | Technology or responsibility                                      |
| ----------------- | ----------------------------------------------------------------- |
| Mobile UI         | React Native, React, Expo, and TypeScript.                        |
| Navigation        | Expo Router with file-based routes.                               |
| Device storage    | `expo-sqlite`, accessed through repositories.                     |
| Speech            | `expo-speech-recognition` behind a `SpeechTranscriber` interface. |
| Connectivity      | `@react-native-community/netinfo`.                                |
| Mobile requests   | `fetch`, `AbortController`, and shared Zod schemas.               |
| Backend           | Node.js, TypeScript, and Express.                                 |
| AI integration    | OpenAI SDK and structured output.                                 |
| Shared validation | Zod request, response, and generated-content schemas.             |
| Tooling           | Yarn Classic, TypeScript, ESLint, Prettier, and Vitest.           |
| Native builds     | EAS cloud builds or local Expo native builds.                     |

```text
Mobile screens
   |
   +-- Journal / settings repositories --> on-device SQLite
   |
   +-- Speech adapter --> native on-device recognizer
   |
   +-- SynthesisService --> synthesis client
                              |
                       local dirabl backend
                              |
                            OpenAI
```

Screens use repositories rather than embedding SQL. The synthesis service coordinates request attempts and database updates. The speech adapter isolates native recognition details from screen state.

### Source map

| Location                      | Responsibility                                                         |
| ----------------------------- | ---------------------------------------------------------------------- |
| `app/app/`                    | Library, new-entry, detail, settings, and navigation routes.           |
| `app/src/components/ui.tsx`   | Shared visual components and styles.                                   |
| `app/src/features/journal/`   | Save flow and automatic-synthesis eligibility.                         |
| `app/src/features/synthesis/` | Consent and synthesis orchestration.                                   |
| `app/src/services/database/`  | Database initialization, migrations, repositories, and React context.  |
| `app/src/services/speech/`    | Native adapter, speech interface, and transcript buffering.            |
| `app/src/services/api/`       | Synthesis HTTP client.                                                 |
| `app/src/types/`              | Journal types and status labels.                                       |
| `server/src/`                 | Express endpoints, local startup restrictions, and OpenAI integration. |
| `shared/synthesis.ts`         | Request, response, and content schemas.                                |
| `tests/`                      | Logic, database, API, and workflow coverage.                           |

## 10. Local data storage

The app opens `dirabl.db` through `SQLiteProvider`. Initialization enables SQLite write-ahead logging and applies a versioned schema migration. The current schema version is 1.

The `journal_entries` table stores:

- A UUID, UTC creation/update timestamps, and the local journal date at creation.
- The original transcript and optional generated story and title.
- Tags serialized as JSON.
- Synthesis status, model identifier, and the last synthesis error.
- The transcript revision, synthesized revision, and active attempt identifier.

The `app_settings` table stores consent, automatic synthesis, the local display name, the preferred reading view, and onboarding completion. SQL statements use bound parameters. The library orders entries by creation time, and timestamps are displayed in the device's local format.

Journal text is plain text rather than rendered HTML. The app sandbox protects access to its files, but dirabl does not add database encryption. There is no app-level backup, export, import, or synchronization feature.

## 11. Backend and API contract

The backend exposes two routes:

| Endpoint                       | Purpose                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `GET /health`                  | Returns `{ "ok": true }` when the backend is running. It does not verify an OpenAI request.       |
| `POST /api/journal/synthesize` | Validates a transcript, requests synthesis, and returns validated content with matching metadata. |

The synthesis request contains:

```json
{
  "entryId": "0f9c3d70-fd0a-4dcc-8555-2b91a3db54bf",
  "attemptId": "a381af8c-660a-4742-82ec-5f73fb4ef89d",
  "transcriptRevision": 1,
  "rawTranscript": "I went for a walk today."
}
```

A successful response contains `entryId`, `attemptId`, `transcriptRevision`, `model`, `title`, `story`, and `tags`. The mobile client rejects mismatched metadata and invalid content.

The server limits JSON bodies to 128 KB. It applies in-memory limits of six requests per minute per client IP and 100 requests per daily process window. Restarting the server resets those counters. Provider failures are translated into controlled errors, and the server does not intentionally log transcript or generated-story content.

The current backend is restricted to local development: it accepts loopback or private LAN bind addresses and refuses `NODE_ENV=production`. It has no production client authentication, durable quotas, or public deployment setup.

## 12. Privacy and consent

| Data                              | Handling                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Dictation audio                   | Processed through the device's on-device recognizer; the app does not retain or upload an audio recording. |
| Unfinished text                   | Held in app memory until Finish.                                                                           |
| Saved transcripts and stories     | Stored in SQLite on the device.                                                                            |
| Transcript selected for synthesis | Sent to the dirabl backend and then OpenAI after consent.                                                  |
| OpenAI API key                    | Loaded by the backend from server configuration.                                                           |
| Consent preferences               | Stored locally in SQLite.                                                                                  |

Consent can be reset in settings, which also disables automatic synthesis. Previously generated stories remain in the local journal.

The backend sets `store: false` for OpenAI requests. Provider data-handling and retention policies still apply; this setting does not establish a guarantee of zero retention.

## 13. Development builds, preview builds, and configuration

The installed native app and the JavaScript server are separate parts of the development setup.

| Aspect                         | Development build                                                            | Preview build                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| EAS profile                    | `development`                                                                | `preview`                                                                         |
| JavaScript source              | Loads the local project from Metro during development.                       | Runs JavaScript bundled into the APK or iOS app at build time.                    |
| Role of `yarn start`           | Serves the code that the connected development app loads.                    | Does not replace the JavaScript embedded in an installed preview app.             |
| Synthesis URL configuration    | Local `app/.env` is read by Metro.                                           | The URL must be supplied to the EAS build environment or profile before building. |
| Applying JavaScript changes    | Reload through Metro; restart Metro when changing environment configuration. | Rebuild and install the updated app in the current setup.                         |
| Standalone offline cold starts | Use a preview build for acceptance testing without Metro.                    | The app includes its JavaScript and can open its local journal without Metro.     |

Native dependency and native configuration changes require a new native build even when using a development client. The custom speech module requires a native app build; the current workflow uses a development client rather than Expo Go.

### Local commands

Run these in separate terminals from the repository root:

```sh
yarn start
```

```sh
yarn server
```

Metro normally uses port 8081 and can select another port when it is occupied. The app must connect to the port of the intended running Metro session. The synthesis backend uses port 3001 by default.

To create an Android development APK, run from `app/`:

```sh
eas build --platform android --profile development
```

The development APK must be installed on the device or emulator and connected to Metro. Starting Metro alone does not convert an installed preview APK into a development client.

### Environment configuration

| File / setting                              | Purpose                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `app/.env`: `EXPO_PUBLIC_SYNTHESIS_API_URL` | Public backend base URL used by the mobile client. It contains no API secret.                                |
| `server/.env`: `OPENAI_API_KEY`             | Server-only provider credential.                                                                             |
| `server/.env`: `OPENAI_MODEL`               | Model selection; defaults to `gpt-6-luna`.                                                                   |
| `server/.env`: `HOST`, `PORT`               | Backend bind address and listening port.                                                                     |
| `DIRABL_ALLOW_LOCAL_HTTP=1`                 | Enables native local-HTTP access for the testing builds. Changing native network policy requires rebuilding. |

Ignored local `.env` files are not included in the EAS cloud build upload. Preview builds therefore need their public URL configured separately. The OpenAI key belongs only on the backend.

For a physical device, the backend must be reachable from that device. A private LAN IP can change when the computer changes networks; both the bind address and mobile URL need to agree with the current network setup. The mobile client allows private-network HTTP and requires HTTPS for other hosts.

### Common synthesis failures

| Symptom                                     | Meaning and next check                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Synthesis is not configured**             | The code running in the app has no synthesis URL. Check the actual installed build, Metro connection, and environment used to produce its JavaScript. |
| Backend startup reports `EADDRNOTAVAIL`     | The configured bind address is not currently assigned to the computer. Check `HOST` and the computer's current network address.                       |
| **Could not reach the synthesis service**   | A URL exists, but the request failed. Check backend availability, routing, firewall, and native HTTP policy.                                          |
| **Synthesis timed out**                     | The client did not receive a response within its timeout. The transcript remains saved.                                                               |
| **The service is busy**                     | A local or provider rate limit was reached.                                                                                                           |
| An old error remains visible after a reload | The last failure is stored with the entry. A new synthesis attempt updates that state.                                                                |

## 14. Verification and current limits

The repository contains tests for SQLite persistence and revision guards, transcript buffering, the native speech adapter with mocked events, synthesis request validation, provider-response handling, consent defaults, save-before-request behavior, automatic eligibility, duplicate attempts, stale responses, and failure/retry workflows.

The following was observed during Android emulator verification on October 24, 2026:

- An EAS development APK built successfully.
- Its signing certificate matched the installed preview APK.
- Installing it as an update preserved both existing saved entries.
- The installed app was confirmed to be debuggable and connected to Metro.
- Retrying synthesis on a previously failed saved entry produced a title, story, and tags, and the UI showed **Story ready**.

This verification covers a live synthesis flow on the emulator. Physical-device speech recognition, offline language models, long dictation, airplane-mode behavior, accessibility, and interrupted-session behavior still need the acceptance checks in [DEVICE_TESTS.md](DEVICE_TESTS.md).

Current product limits include:

- Foreground-only dictation using `en-US`.
- No incremental draft autosave before Finish.
- No direct editing of generated stories, titles, or tags.
- No entry-deletion UI, search, filtering, calendar, or rich-text editor.
- No app-level backup/export/import, account system, or multi-device synchronization.
- No handwriting fonts, writing-style imitation, sentiment analysis, or AI chat.
- No offline AI synthesis or background queue for offline entries.
- No separately encrypted journal database.
- A local-development backend that still needs public-release authentication, durable abuse limits, and secure hosting work.

## Related documents

- [README](../README.md): installation, commands, and project setup.
- [Device acceptance checklist](DEVICE_TESTS.md): native and offline behavior to verify.
- [Build plan](../BUILD_PLAN.md): original scope, design intent, and deferred features.
- [Work log](../WORK_LOG.md): implementation checkpoints and earlier validation results.
