# dirabl editorial UI

Implemented from [dirabl — Journal UI / Editorial Concept v1](https://www.figma.com/design/yiT50Slv503VNg1PFuyQPJ/dirabl), using **01 - main flow** and **02 - first run onboarding**.

## Main flow

The app uses the Figma palette and typography: Instrument Serif for editorial headings, Newsreader for journal text, and Inter for controls and metadata. React Native layouts adapt the reference frames to the viewport, safe areas, keyboard, and real journal content.

| Figma frame                | App implementation                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `3:3` / populated journal  | Featured latest entry, count, recent entries, expandable archive, and a fixed new-entry action.   |
| `3:32` / empty journal     | Editorial introduction, quotation mark, and first-entry action.                                   |
| `3:45` / new entry         | Ruled writing surface, date, device-privacy note, dictation, and Finish.                          |
| `3:65` / dictating         | Microphone treatment, live status, committed text, and interim text.                              |
| `4:7` / story              | Generated title and tags, reading typography, segmented Story/Original control, and edit action.  |
| `4:32` / original          | Local-save notice, preserved transcript, and optional synthesis action.                           |
| `4:56` / editing           | Transcript editor, stale-story explanation, save, and cancel.                                     |
| `4:71` / settings          | Storage disclosure, automatic synthesis, consent controls, and local preferences.                 |
| `4:95` / consent           | Explicit data-sharing consent in a bottom sheet; reviewing the disclosure does not grant consent. |
| `4:119` / failed synthesis | Saved-entry reassurance, original text, error details, and retry.                                 |

The existing repositories, on-device speech adapter, save-before-request rule, revision protection, and synthesis service remain the basis of these screens.

## First-run onboarding

Fresh journals enter onboarding before the main app. Completion is saved locally. Existing journal owners can continue directly into their saved journal and open **Settings → Review your setup** to review the flow.

The onboarding includes:

1. Welcome and journal introduction.
2. An optional local name.
3. Planned handwriting support, with a clearly labeled illustrative sample preview.
4. A comparison of original text and AI synthesis, with an explicit manual/automatic choice.
5. A saved Story-first or Original-first reading preference. Reminder controls remain marked as planned.
6. A separate privacy and consent step when automatic synthesis is requested.
7. A setup summary and handoff to New Entry or My Journal.

Automatic synthesis requires an explicit agreement. A recommended option is not consent. Skipping that agreement leaves automatic synthesis off. The manual path can finish without granting AI consent; a later manual synthesis request uses the normal consent sheet.

Handwriting import, personal font generation, and notification scheduling are future features. The sample preview is an illustration and does not select, upload, or generate a font from a user's file.

## Persistence

`app_settings` also stores `displayName`, `preferredReadingView`, and `onboardingCompleted`. Completing onboarding saves the profile and consent choices in one transaction. This onboarding save enables automatic synthesis only when consent is also explicitly saved.

Initialization marks an existing journal as already onboarded when no completion flag exists. It preserves explicit flags and journal entries. No journal schema change is required.

The reading preference determines which available version opens in entry detail. Names stay local and are not added to synthesis requests. Both preferences can be changed in Settings.

## Bundled design assets

The app bundles the exported arrow, microphone, lock, upload, reminder-off, and synthesis-off SVG assets. Original files are in `app/assets/icons/source/`. PNG renders at 1x, 2x, and 3x support native images while retaining the original proportions and logical dimensions.

| Asset                   | Logical size |
| ----------------------- | ------------ |
| Latest-entry arrow      | 20 × 20      |
| Microphone              | 34 × 34      |
| Local-name lock         | 21 × 21      |
| Planned upload          | 27 × 27      |
| Planned reminder switch | 55 × 30      |
| Synthesis switch, off   | 58 × 32      |

Font files and their open-source licenses are in `app/assets/fonts/`. Shared font and color definitions are in `app/src/components/theme.ts`; shared controls are in `app/src/components/ui.tsx`. Fonts and icons load from local bundled assets.

## Validation

The automated suite covers onboarding defaults, persisted choices after reopening SQLite, explicit consent before automatic synthesis, upgrades of existing journals, and transaction rollback when setup fails. Existing journal, speech, API, and workflow tests also run. All 29 tests passed during implementation.

Visual checks use the Android development app and isolated local test journals. Physical-device speech and accessibility acceptance remain covered by [DEVICE_TESTS.md](DEVICE_TESTS.md).
