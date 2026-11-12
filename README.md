# Work log (Quixta Ventures take-home)

Offline-first work log: drafts survive without network, an expired token is
refreshed once, a submitted entry is never overwritten, entries open from a deep
link, and the project is set up for EAS releases.

- **Expo SDK:** 58 (`expo ~58.0.23`, `expo-router 58.0.30`, `jest-expo 58.0.14`,
  `@testing-library/react-native 14.1.0`)
- **Time spent:** about 6 hours, all on 11 November 2026.
- **Docs:** [CONFLICTS.md](CONFLICTS.md), [RELEASE.md](RELEASE.md)

- **Screen recording:** https://drive.google.com/drive/folders/1EbZeAbDR6ziNlY2hOF0Om3pNUh3vsdop?usp=sharing
## Install and run

```bash
npm install
npx expo start              # then press i for the iOS simulator
npx expo start --web        # web
npx expo run:ios            # development build (needed for the worklog:// link)
```

Expo Go cannot open `worklog://` links, so the deep link needs a development
build or web. Native folders are generated (`npx expo prebuild --clean`), not
committed.

## Test

```bash
npm test                    # Jest, no device needed
npx tsc --noEmit            # type check
```

`expo-secure-store` and AsyncStorage are mocked in `jest.setup.ts`, which also
clears storage and resets the fake server before each test.

| Brief test | File |
|---|---|
| Submitted row | `__tests__/sync.test.ts` ("required test 1") |
| One refresh | `__tests__/sync.test.ts` ("required test 2") |
| Draft restore | `__tests__/draftRestore.test.tsx` (screen) and `__tests__/draftForm.test.ts` (storage helper) |
| Detail route (optional) | `__tests__/entryDetail.test.tsx` |

Also: `validation.test.ts` (domain rules) and `fakeServer.test.ts` (test handles).

## Deep link

Scheme `worklog`. On iOS simulator:

```bash
xcrun simctl openurl booted worklog://entries/srv_1      # warm or cold start
xcrun simctl openurl booted worklog://entries/zzz        # "Entry not found"
```

On web: `/entries/srv_1`. Routes live in `src/app/` (the SDK 58 template
default), so the detail route is `src/app/entries/[id].tsx`. The root layout
seeds tokens and runs a first sync before rendering, so a cold start does not
flash "Entry not found", and `initialRouteName: 'index'` makes Back go to the list.

## Test handles (fake server)

The API is a plain in-memory TypeScript module, not Expo API routes, because the
brief asks for no real network. Handles are exported from `src/api/fakeServer.ts`:

| Handle | Purpose |
|---|---|
| `setOnline(boolean)` | set the server online or offline |
| `expireAccessToken()` | the next call returns 401 |
| `failRetryAfterRefresh(boolean)` | the one retry after a refresh also returns 401 |
| `getEntries()` | read the entries |
| `getRefreshCount()` | how many times refresh ran |
| `resetServer()` | extra, not in the brief: reset state in `beforeEach` |

In development, a dev panel on the list screen (`__DEV__` only) wraps these
handles, plus a button that queues a local edit for `srv_1`.

## Structure

```
src/domain/    types and validation (no React)
src/api/       fakeServer.ts, client.ts (401 -> one refresh -> one retry)
src/storage/   kv (secure store / localStorage), tokens, draftForm, queue, serverCache
src/sync.ts    sync engine (single-flight)
src/data/      small contract the screens use
src/screens/   EntryForm, EntryList, EntryDetail
src/components/ DurationPicker, DevPanel
src/app/       Expo Router routes (thin)
```

Storage: tokens in `expo-secure-store` (`access_token`, `refresh_token`); form
(`draft_form`), queue and server cache in AsyncStorage. The list is the cached
server snapshot plus the pending queue, so there is no second entries store.

## Design notes

- **Conflict rule** and my assumptions: see CONFLICTS.md.
- **Refresh once:** the client does at most one refresh and one retry per
  operation. A second 401 gives "Session expired" and no further refresh.
  Overlapping syncs share one refresh (single-flight).
- **Nothing dropped:** a queued operation is removed only after the server
  answered. Offline or "Session expired" stops the loop and keeps the rest.
- **Picker and validation:** duration uses a 15-minute picker; `validateDuration`
  and `validateDate` still guard restored and queued data.

## Known behaviour and limitations

- The fake server resets on every launch, but tokens persist. After one refresh
  the stored token is `access_2`, so the next launch causes one refresh during
  the first sync.
- On web, tokens fall back to `localStorage` (no secure store on web). The tokens
  are fake.
- No edit screen (the brief has none). A draft cannot be submitted later from
  the UI.
- No real project id: `app.json` and `eas.json` are configured, but no Expo
  account was used and no build or update was run.
- Not done: <list anything missing, e.g. extra tests for the duplicate warning
  screen, partial queue failure and the 409 race; web check>.

## AI tools

- **Tools:** Claude for <planning, sync engine, tests, docs drafts>.

- **Where I disagreed:** Claude described the conflict rule as "no merge, no
  newer-wins" as if the brief said so. I checked the brief, it does not, so I
  kept the rule close to the brief's wording and moved my extra decisions into a
  separate "My assumptions" section in CONFLICTS.md.
