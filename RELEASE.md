# Release plan

No build or update was run for this task and no Expo account was used. The
project id in `app.json` is a placeholder. This document is the plan.

## 1. Versioning

Three numbers, three owners:

- **Store version** (`version` in `app.json`, e.g. 1.0.0). What users see in the
  store. Bumped by the developer, by hand, when a release has user-visible
  changes. Semver: patch for fixes, minor for features, major for big changes.
- **Build number** (iOS `buildNumber`, Android `versionCode`). Must increase on
  every binary uploaded to a store, even for the same store version. Not bumped
  by hand: the production profile in `eas.json` uses `autoIncrement`, so EAS
  bumps it per build.
- **Runtime version** (`runtimeVersion.policy: appVersion`). Tells `expo-updates`
  which JavaScript bundles a given binary can safely run. With the `appVersion`
  policy it follows the store version, so bumping `version` also starts a new
  runtime. The developer bumps it, by bumping the store version, on any change
  that needs new native code. It is never bumped for JS-only releases.

Rule of thumb: JS-only change, ship an update on the same runtime. Native change,
bump the store version, build, submit.

## 2. OTA update or new store build

An OTA update replaces the JavaScript bundle and assets only. Anything that
changes native code, permissions or app config needs a new binary.

**Can go out OTA (JS only):**

1. Changing the duplicate-warning or duration messages, or the range-before-step
   check order, in `src/domain/validation.ts`.
2. A fix to the sync engine in `src/sync.ts` (for example how a 409 is handled).
   Same native modules, so the existing binary can run it.

**Needs a new store build (native or config):**

1. Adding a local notification library (for example `expo-notifications`). It
   adds native code and permission strings, so existing binaries do not contain
   it. An OTA that imports it would crash on those binaries. Needs a runtime bump.
2. Changing `scheme`, `ios.bundleIdentifier`, `android.package` or adding a plugin
   in `app.json`. These are baked into the native project (the `worklog://`
   scheme lives in `Info.plist` and the Android manifest).

Also needs a build: upgrading the Expo SDK, or adding any package with native code.

## 3. Staged production rollout and rollback

Channels are `development`, `preview` and `production`, one per build profile.

1. Build the release candidate on `preview`. Test on real devices: the three
   tests, plus the deep link (warm start, cold start, unknown id).
2. Submit the production build with a staged rollout: Google Play staged rollout
   (for example 5%, 20%, 50%, 100%) and Apple phased release (7 days).
3. For JS fixes, publish the update to a small share of the `production` channel
   first, watch the numbers, then widen it.
4. Watch: crash-free sessions, "Session expired" rate, operations stuck in the
   queue.

Rollback:

- **OTA:** republish the previous known-good update to the same channel. Users
  get it on next launch. No store review needed.
- **Store build:** halt the staged rollout, then ship a fixed build. Apple cannot
  force users back to an old binary, so the fix is a new build. An OTA can patch
  JS meanwhile if the runtime matches.
- Keep risky behaviour behind a flag so an OTA can turn it off.

## 4. Apple rejects a build two days before a promised date

1. Read the rejection reason first. Many are fixable in hours (metadata, a
   missing privacy string, a crash on their device).
2. If it is a code or config issue: fix it, bump the build number, resubmit with
   a short note to App Review, and ask for an expedited review citing the date.
3. An OTA cannot fix the review itself (the reviewer tests the submitted binary),
   but it can fix users on the previous version.
4. Tell the stakeholder today: what happened, the fix, the realistic new date,
   and what ships meanwhile (an Android release, or the last approved iOS build
   plus an OTA). Do not promise the original date.
5. Afterwards, add the cause to a pre-submission checklist.

## 5. Warning someone before a work-log deadline (local notification)

Not built, this is the plan.

- **Trigger:** a local scheduled notification at a set time before the deadline
  (for example the evening before), only for entries still in draft. Cancel it
  when the entry is submitted, reschedule if the deadline changes. The trigger is
  a date, so firing it needs no network.
- **Permission prompt:** ask when the person first saves a draft with a deadline,
  after a one-line explanation in the app, not on first launch. iOS shows the
  system prompt only once.
- **If denied:** do not nag and do not break anything. Show an in-app banner for
  drafts due soon and a link to system settings.
- **Avoid scheduling while offline:** do not schedule from data that has not
  synced, for example a deadline that may have changed on the server or a draft
  the server already has as submitted ("Server copy kept"). Schedule from the
  server copy after a successful sync, and cancel on sync if the row turned
  submitted, so nobody is warned about work that is already done.