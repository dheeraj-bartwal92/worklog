# Conflict rule

## The rule

Submitted rows belong to the server. If an entry is already submitted on the
server and the device has a queued edit for the same id, that edit is thrown
away when sync runs, and the screen keeps the server copy and shows
"Server copy kept".

Draft rows belong to the device until sync creates them on the server. Until
then nothing is dropped: if the network is down the change stays in the queue
and the row shows "Waiting to sync".

In short: once a row is submitted, the server copy wins. Before that, the
device copy is the one that counts.

## How it is built

- `src/sync.ts` pulls the server list first. For each queued operation, if the
  server row for that id is `submitted`, the operation is removed from the
  queue without calling the server, and the result reports
  `keptServerCopy: [id]` with the notice "Server copy kept".
- An operation is removed from the queue only after the server has answered.
  On a network error or "Session expired" the loop stops and the rest of the
  queue stays as it is, in order.
- The fake server also refuses a write to a submitted row (HTTP 409). If a row
  becomes submitted between the pull and the push, the 409 is handled the same
  way as the check above (Server copy kept).
- The list shows the server copy for a submitted id even while a local edit is
  queued for it, so the local edit never replaces it on screen.

## Required test

`__tests__/sync.test.ts`, "required test 1": seed `srv_1` as submitted, queue
an edit that changes its note, run sync online. The server note is still
`Lobby`, the result notice is "Server copy kept", and the queue is empty.

## My assumptions (not stated in the brief)

1. **Server-side 409.** The brief only asks for the client to drop the edit. I
   made the fake server also refuse writes to a submitted row, as a second
   layer for the case where the row is submitted after the pull.
2. **Client-generated ids and idempotent create.** New entries get an id on the
   device, and the fake server's create does nothing if that id already exists.
   A retry after a lost response therefore never creates a duplicate.
3. **No edit screen.** The brief only has a new-entry form. A "local edit" is
   queued directly, as in required test 1. For the recording, the dev panel has
   a button that queues an edit for `srv_1`.
4. **Retry flag is one-shot.** `failRetryAfterRefresh` fails only the one call
   after a refresh, so the next sync after "Session expired" can succeed.
5. **Duplicate warning is not a block.** Same category and date as any existing
   entry (draft or submitted) shows "You already have this category on this
   date" and the save still goes through.
6. **Range is checked before step** for duration. 10 and 730 show the range
   message, 20 and 100 show the step message.
7. **Duration and date inputs.** Duration uses a picker in 15-minute steps, and
   date is a text field in YYYY-MM-DD. `validateDuration` and `validateDate`
   still run on restored and queued data.
8. **Save draft and Submit clear the form** and remove `draft_form` after the
   operation is queued.
9. **Tokens on web** fall back to `localStorage` because `expo-secure-store`
   has no web support. The tokens are fake, so this is acceptable here.
10. **Fake server resets on every launch, tokens do not.** After a refresh the
    stored token is `access_2`, so the next launch causes one refresh during
    the first sync. This is an artifact of the in-memory server.

## Known edge cases

- A submit that is repeated after a lost response is treated as already
  applied. A real API would need an idempotency key.
- A draft cannot be submitted later from the UI (there is no edit screen). 
- A new entry can be saved as a draft or submitted directly.