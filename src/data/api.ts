import { Entry } from '@/domain/types';
import { enqueueOp, loadQueue } from '@/storage/queue';
import { loadServerCache } from '@/storage/serverCache';

export { sync } from '@/domain/sync';
export type { SyncResult } from '@/domain/sync';

export type Operation = { type: 'save_draft' | 'submit'; entry: Entry };
export interface ListRow { entry: Entry; pending: boolean }

const newOpId = () => `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const enqueue = (op: Operation) => enqueueOp({ opId: newOpId(), ...op });

export async function loadRows(): Promise<ListRow[]> {
  const rows = new Map<string, ListRow>();
  for (const e of await loadServerCache()) rows.set(e.id, { entry: e, pending: false });
  for (const op of await loadQueue()) {
    const server = rows.get(op.entry.id);
    rows.set(op.entry.id, server?.entry.status === 'submitted'
      ? { entry: server.entry, pending: true }
      : { entry: op.entry, pending: true });
  }
  return [...rows.values()];
}

export const loadEntries = async (): Promise<Entry[]> => (await loadRows()).map((r) => r.entry);

export async function getEntry(id: string): Promise<Entry | null> {
  return (await loadRows()).find((r) => r.entry.id === id)?.entry ?? null;
}