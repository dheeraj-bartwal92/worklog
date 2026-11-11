import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry } from '../domain/types';

export const CACHE_KEY = 'server_cache';

export async function loadServerCache(): Promise<Entry[]> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export const saveServerCache = (entries: Entry[]) =>
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries));