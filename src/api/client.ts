import { refresh } from './fakeServer';
import { getRefreshToken, setAccessToken, getAccessToken } from '../storage/tokens';

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
    Object.setPrototypeOf(this, SessionExpiredError.prototype);
  }
}

export const isNetworkError = (e: unknown) => (e as any)?.name === 'NetworkError';
export const isSessionExpired = (e: unknown) => (e as any)?.name === 'SessionExpiredError';
export const isHttp = (e: unknown, status: number) =>
  (e as any)?.name === 'HttpError' && (e as any).status === status;

let refreshing: Promise<string> | null = null;

function refreshOnce(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      const token = await refresh(await getRefreshToken());
      await setAccessToken(token);
      return token;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}

export async function withAuth<T>(call: (token: string | null) => Promise<T>): Promise<T> {
  try {
    return await call(await getAccessToken());
  } catch (e) {
    if (!isHttp(e, 401)) throw e;
  }

  let fresh: string;
  try {
    fresh = await refreshOnce();
  } catch (e) {
    if (isHttp(e, 401)) throw new SessionExpiredError();
    throw e;
  }

  try {
    return await call(fresh);
  } catch (e) {
    if (isHttp(e, 401)) throw new SessionExpiredError(); // no second refresh
    throw e;
  }
}