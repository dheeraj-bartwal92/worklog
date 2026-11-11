import {
    createEntry, expireAccessToken, failRetryAfterRefresh, getEntries, getRefreshCount,
    HttpError, listEntries, NetworkError, refresh, resetServer, setOnline,
    submitEntry, updateEntry,
} from '../src/api/fakeServer';
import { Entry } from '../src/domain/types';

const draft: Entry = {
  id: 'loc_1', category: 'repair', date: '2026-06-02',
  durationMinutes: 90, note: 'Pump', status: 'draft',
};

beforeEach(() => resetServer());

describe('seed and auth', () => {
  it('starts with srv_1 submitted', () => {
    const e = getEntries();
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ id: 'srv_1', note: 'Lobby', status: 'submitted' });
  });
  it('accepts access_1', async () => {
    expect(await listEntries('access_1')).toHaveLength(1);
  });
  it('rejects a wrong or missing token with 401', async () => {
    await expect(listEntries('bad')).rejects.toMatchObject({ status: 401 });
    await expect(listEntries(null)).rejects.toMatchObject({ status: 401 });
  });
});

describe('offline', () => {
  it('throws NetworkError and changes nothing', async () => {
    setOnline(false);
    await expect(createEntry('access_1', draft)).rejects.toBeInstanceOf(NetworkError);
    setOnline(true);
    expect(getEntries()).toHaveLength(1);
  });
  it('refresh also fails offline with NetworkError, not 401', async () => {
    setOnline(false);
    await expect(refresh('refresh_ok')).rejects.toBeInstanceOf(NetworkError);
    expect(getRefreshCount()).toBe(0);
  });
});

describe('expire and refresh', () => {
  it('expired access gives 401', async () => {
    expireAccessToken();
    await expect(listEntries('access_1')).rejects.toBeInstanceOf(HttpError);
  });
  it('refresh with refresh_ok returns access_2 and counts once', async () => {
    expireAccessToken();
    expect(await refresh('refresh_ok')).toBe('access_2');
    expect(getRefreshCount()).toBe(1);
    expect(await listEntries('access_2')).toHaveLength(1);
  });
  it('refresh with a wrong token gives 401 and is not counted', async () => {
    await expect(refresh('nope')).rejects.toMatchObject({ status: 401 });
    expect(getRefreshCount()).toBe(0);
  });
  it('failRetryAfterRefresh fails exactly one call after refresh', async () => {
    expireAccessToken();
    failRetryAfterRefresh(true);
    await refresh('refresh_ok');
    await expect(listEntries('access_2')).rejects.toMatchObject({ status: 401 });
    // the flag was one-shot: the next call works
    expect(await listEntries('access_2')).toHaveLength(1);
    expect(getRefreshCount()).toBe(1);
  });
});

describe('writes', () => {
  it('create adds a draft', async () => {
    await createEntry('access_1', draft);
    expect(getEntries()).toHaveLength(2);
    expect(getEntries()[1].status).toBe('draft');
  });
  it('create is idempotent on the same id', async () => {
    await createEntry('access_1', draft);
    await createEntry('access_1', draft);
    expect(getEntries()).toHaveLength(2);
  });
  it('update changes a draft', async () => {
    await createEntry('access_1', draft);
    await updateEntry('access_1', { ...draft, note: 'Valve' });
    expect(getEntries()[1].note).toBe('Valve');
  });
  it('update of a missing id gives 404', async () => {
    await expect(updateEntry('access_1', draft)).rejects.toMatchObject({ status: 404 });
  });
  it('submit marks the row submitted', async () => {
    await createEntry('access_1', draft);
    await submitEntry('access_1', 'loc_1');
    expect(getEntries()[1].status).toBe('submitted');
  });
  it('refuses to update a submitted row with 409 and keeps the note', async () => {
    await expect(
      updateEntry('access_1', { ...getEntries()[0], note: 'Changed' }),
    ).rejects.toMatchObject({ status: 409 });
    expect(getEntries()[0].note).toBe('Lobby');
  });
});

describe('resetServer', () => {
  it('restores the initial state', async () => {
    await createEntry('access_1', draft);
    expireAccessToken();
    setOnline(false);
    resetServer();
    expect(getEntries()).toHaveLength(1);
    expect(await listEntries('access_1')).toHaveLength(1);
  });
});