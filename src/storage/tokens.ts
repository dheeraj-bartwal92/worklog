import { kv } from './kv';

export const ACCESS_KEY = 'access_token';
export const REFRESH_KEY = 'refresh_token';

export const getAccessToken = () => kv.get(ACCESS_KEY);
export const getRefreshToken = () => kv.get(REFRESH_KEY);
export const setAccessToken = (t: string) => kv.set(ACCESS_KEY, t);

export async function ensureSeeded(): Promise<void> {
  if (!(await kv.get(ACCESS_KEY))) await kv.set(ACCESS_KEY, 'access_1');
  if (!(await kv.get(REFRESH_KEY))) await kv.set(REFRESH_KEY, 'refresh_ok');
}

export async function resetTokensForDev(): Promise<void> {
  await kv.set(ACCESS_KEY, 'access_1');
  await kv.set(REFRESH_KEY, 'refresh_ok');
}