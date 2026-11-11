import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry } from '../domain/types';

export const QUEUE_KEY = 'sync_queue';

export interface QueuedOp {
  opId: string;
  type: 'save_draft' | 'submit';
  entry: Entry;
}

let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

async function read(): Promise<QueuedOp[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export const loadQueue = () => locked(read);

export const enqueueOp = (op: QueuedOp) =>
  locked(async () => {
    const q = await read();
    q.push(op);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  });

export const removeOp = (opId: string) =>
  locked(async () => {
    const q = (await read()).filter((o) => o.opId !== opId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  });