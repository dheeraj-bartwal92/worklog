import {
    expireAccessToken, failRetryAfterRefresh, getEntries, getRefreshCount, setOnline,
} from '@/api/fakeServer';
import { sync } from '@/domain/sync';
import { Entry } from '@/domain/types';
import { enqueueOp, loadQueue } from '@/storage/queue';
import { getAccessToken } from '@/storage/tokens';

const draft: Entry = {
  id: 'loc_1', category: 'repair', date: '2026-06-02',
  durationMinutes: 90, note: 'Pump', status: 'draft',
};
const queueDraft = () => enqueueOp({ opId: 'op_1', type: 'save_draft', entry: draft });

describe('required test 1: submitted row', () => {
  it('drops a queued edit for a submitted id and surfaces Server copy kept', async () => {
    await enqueueOp({
      opId: 'op_edit', type: 'save_draft',
      entry: { id: 'srv_1', category: 'inspection', date: '2026-06-01',
        durationMinutes: 60, note: 'Changed', status: 'draft' },
    });
    const r = await sync();
    expect(getEntries().find((e) => e.id === 'srv_1')?.note).toBe('Lobby');
    expect(getEntries().find((e) => e.id === 'srv_1')?.status).toBe('submitted');
    expect(r.notice).toBe('Server copy kept');
    expect(r.keptServerCopy).toEqual(['srv_1']);
    expect(await loadQueue()).toEqual([]);
  });
});

describe('required test 2: one refresh', () => {
  it('refreshes once and the retried call succeeds with access_2', async () => {
    await queueDraft();
    expireAccessToken();
    const r = await sync();
    expect(getRefreshCount()).toBe(1);
    expect(r.status).toBe('synced');
    expect(await getAccessToken()).toBe('access_2');
    expect(getEntries().some((e) => e.id === 'loc_1')).toBe(true);
  });

  it('shows Session expired when the retry also fails, with no second refresh', async () => {
    await queueDraft();
    expireAccessToken();
    failRetryAfterRefresh(true);
    const r = await sync();
    expect(getRefreshCount()).toBe(1);
    expect(r.status).toBe('session_expired');
    expect(r.notice).toBe('Session expired');
    expect((await loadQueue()).length).toBe(1); // nothing dropped
    expect(getEntries().some((e) => e.id === 'loc_1')).toBe(false);
  });

  it('two overlapping syncs still refresh only once', async () => {
    await queueDraft();
    expireAccessToken();
    await Promise.all([sync(), sync()]);
    expect(getRefreshCount()).toBe(1);
  });
});

describe('offline', () => {
  it('keeps the queue offline, then syncs exactly once online', async () => {
    await queueDraft();
    setOnline(false);
    const off = await sync();
    expect(off.status).toBe('offline');
    expect((await loadQueue()).length).toBe(1);
    expect(getEntries()).toHaveLength(1);

    setOnline(true);
    const on = await sync();
    expect(on.status).toBe('synced');
    expect(await loadQueue()).toEqual([]);
    expect(getEntries().filter((e) => e.id === 'loc_1')).toHaveLength(1);
  });

  it('submit marks the server row submitted', async () => {
    await enqueueOp({ opId: 'op_s', type: 'submit', entry: draft });
    await sync();
    expect(getEntries().find((e) => e.id === 'loc_1')?.status).toBe('submitted');
  });
});