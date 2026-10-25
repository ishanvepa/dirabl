# Physical-device acceptance tests

## Expo Go preview smoke test (pending)

Run `npm run start:go`, scan its QR code using an SDK-compatible Expo Go app, and open New Entry. Confirm that the explanation appears with a text editor, no microphone/model-download/device-settings controls and no permission prompt. Type text, background/return and ensure it remains intact. Finish, open the saved entry from My Journal, edit/save its transcript and test manual synthesis with the configured backend. Reopen the same project to check persistence. Expo Go storage is separate from the installed dirabl development app. Then verify the development build still shows Start Dictating and passes the native tests below.

## Native development build

Not yet executed: this build environment has no attached phone. Use a native development build on iOS 17+ and Android 13+. Recognition language is en-US in this MVP. Platform/locale checks can still overestimate iOS language support; a native error must preserve text and offer typing.

1. Start with permission undecided. Tap Start Dictating and grant microphone/speech access. Confirm listening and partial text, then final text. Deny permissions in a fresh install and verify manual typing works and repeated taps do not prompt again. Restore permissions through Settings.
2. On Android without an installed model, use Download offline English model. Finish the OS download (may be scheduled), reopen New Entry and check support again.
3. Enable airplane mode after installing a local model. Dictate several sentences with pauses/punctuation. Stop immediately after the last word. Check the saved transcript contains it exactly once.
4. Dictate for 5–10 minutes in the foreground. Check paragraph-length output and repeated words/sentences. Native result events lack stable IDs; consecutive identical final events are deduplicated, so intentional identical consecutive utterances need particular attention.
5. Receive a call, lock the device, or background the app. Recognition must stop, retain visible text, and explain interruption when returning. Review partial text retained on timeout/interruption. Unsaved recording is in memory until Finish; force-killing before Finish can lose it.
6. Finish offline, reopen via library, force-stop, relaunch, and reopen again. Verify local persistence.
7. With a configured backend, manually synthesize the offline entry after reconnecting. Reconnection alone must never submit it. Confirm both story and original text survive restart.
8. Opt into automatic synthesis, create an online entry, and finish. Confirm title/story/tags. Disable backend/network, finish again, and verify transcript survives and Retry works.
9. Edit while a delayed synthesis request is running. Save the edit; the old response must be discarded. Kill during a request; relaunch should show manual retry without submitting.
10. Check VoiceOver/TalkBack, large text, small screen scrolling, keyboard coverage, Android back and iOS back gestures with unsaved edits.
