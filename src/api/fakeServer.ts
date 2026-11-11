import { Entry } from "@/domain/types";
export class NetworkError extends Error {
  constructor() { super('Network request failed'); this.name = 'NetworkError'; }
}
export class HttpError extends Error {
  constructor(public status: number) { super(`HTTP ${status}`); this.name = 'HttpError'; }
}

const SEED: Entry = {
  id: 'srv_1', category: 'inspection', date: '2026-06-01',
  durationMinutes: 60, note: 'Lobby', status: 'submitted',
};

function initial() {
  return {
    online: true,
    entries: [{ ...SEED }] as Entry[],
    validAccess: 'access_1' as string | null,
    refreshCount: 0,
    failRetryAfterRefresh: false,
    rejectNextCall: false,
  };
}
let state = initial();

// ---- Test handles (listed in README) ----
export const setOnline = (v: boolean) => { state.online = v; };
export const expireAccessToken = () => { state.validAccess = null; };
export const failRetryAfterRefresh = (v: boolean) => { state.failRetryAfterRefresh = v; };
export const getEntries = (): Entry[] => state.entries.map((e) => ({ ...e }));
export const getRefreshCount = () => state.refreshCount;
// Extra, not in the brief: used in beforeEach.
export const resetServer = () => { state = initial(); };

function authorize(token: string | null) {
  if (!state.online) throw new NetworkError();
  if (state.rejectNextCall) { state.rejectNextCall = false; throw new HttpError(401); }
  if (!token || token !== state.validAccess) throw new HttpError(401);
}

export async function refresh(refreshToken: string | null): Promise<string> {
  if (!state.online) throw new NetworkError();
  if (refreshToken !== 'refresh_ok') throw new HttpError(401);
  state.refreshCount += 1;
  state.validAccess = 'access_2';
  // Assumption: the flag only fails the one retry right after a refresh.
  if (state.failRetryAfterRefresh) {
    state.rejectNextCall = true;
    state.failRetryAfterRefresh = false;
  }
  return 'access_2';
}

export async function listEntries(token: string | null): Promise<Entry[]> {
  authorize(token);
  return getEntries();
}

// Assumption: create is idempotent on a client-generated id, so a retry never duplicates.
export async function createEntry(token: string | null, entry: Entry): Promise<Entry> {
  authorize(token);
  const found = state.entries.find((e) => e.id === entry.id);
  if (found) return { ...found };
  const row: Entry = { ...entry, status: 'draft' };
  state.entries.push(row);
  return { ...row };
}

// Assumption: the server also refuses writes to a submitted row (409).
export async function updateEntry(token: string | null, entry: Entry): Promise<Entry> {
  authorize(token);
  const found = state.entries.find((e) => e.id === entry.id);
  if (!found) throw new HttpError(404);
  if (found.status === 'submitted') throw new HttpError(409);
  Object.assign(found, entry, { status: 'draft' });
  return { ...found };
}

export async function submitEntry(token: string | null, id: string): Promise<Entry> {
  authorize(token);
  const found = state.entries.find((e) => e.id === id);
  if (!found) throw new HttpError(404);
  found.status = 'submitted';
  return { ...found };
}