import { isHttp, isNetworkError, isSessionExpired, withAuth } from '@/api/client';
import { createEntry, listEntries, submitEntry, updateEntry } from '@/api/fakeServer';
import { loadQueue, QueuedOp, removeOp } from '@/storage/queue';
import { saveServerCache } from '@/storage/serverCache';
import { ensureSeeded } from '@/storage/tokens';
import { Entry } from './types';

export const MSG_KEPT = 'Server copy kept';
export const MSG_EXPIRED = 'Session expired';

export interface SyncResult {
  status: 'synced' | 'offline' | 'session_expired';
  notice: string | null; 
  keptServerCopy: string[];
  syncedIds: string[];
}

// Conflict rule: submitted rows belong to the server. A queued edit for an id that is
// already submitted is thrown away. Draft rows belong to the device until sync creates them.
async function applyOp(op: QueuedOp, server: Map<string, Entry>): Promise<'applied' | 'kept'> {
  const existing = server.get(op.entry.id);
  if (existing?.status === 'submitted') return 'kept';

  try {
    if (!existing) {
      await withAuth((t) => createEntry(t, op.entry)); // idempotent on id
    } else if (op.type === 'save_draft') {
      await withAuth((t) => updateEntry(t, op.entry));
    }
    if (op.type === 'submit') await withAuth((t) => submitEntry(t, op.entry.id));
  } catch (e) {
    if (isHttp(e, 409)) return 'kept'; // row was submitted between pull and push
    throw e;
  }
  server.set(op.entry.id, {
    ...op.entry,
    status: op.type === 'submit' ? 'submitted' : 'draft',
  });
  return 'applied';
}

async function runOnce(): Promise<SyncResult> {
  const result: SyncResult = { status: 'synced', notice: null, keptServerCopy: [], syncedIds: [] };
  try {
    await ensureSeeded();
    const server = new Map(
      (await withAuth((t) => listEntries(t))).map((e) => [e.id, e] as [string, Entry]),
    );

    for (const op of await loadQueue()) {
      const outcome = await applyOp(op, server);
      await removeOp(op.opId); // only after the server answered
      if (outcome === 'kept') result.keptServerCopy.push(op.entry.id);
      else result.syncedIds.push(op.entry.id);
    }

    await saveServerCache(await withAuth((t) => listEntries(t)));
  } catch (e) {
    if (isNetworkError(e)) result.status = 'offline'; // queue stays as is
    else if (isSessionExpired(e)) result.status = 'session_expired';
    else throw e;
  }

  if (result.status === 'session_expired') result.notice = MSG_EXPIRED;
  else if (result.keptServerCopy.length) result.notice = MSG_KEPT;
  return result;
}

// Single-flight. A call during a running sync marks "run again" so a freshly
// queued op is never missed, and no second refresh can start in parallel.
let inFlight: Promise<SyncResult> | null = null;
let rerun = false;

export function sync(): Promise<SyncResult> {
  if (inFlight) {
    rerun = true;
    return inFlight;
  }
  inFlight = (async () => {
    const total: SyncResult = { status: 'synced', notice: null, keptServerCopy: [], syncedIds: [] };
    let r: SyncResult;
    do {
      rerun = false;
      r = await runOnce();
      total.status = r.status;
      total.keptServerCopy.push(...r.keptServerCopy);
      total.syncedIds.push(...r.syncedIds);
    } while (rerun && r.status === 'synced');
    total.notice =
      total.status === 'session_expired' ? MSG_EXPIRED : total.keptServerCopy.length ? MSG_KEPT : null;
    return total;
  })().finally(() => { inFlight = null; });
  return inFlight;
}