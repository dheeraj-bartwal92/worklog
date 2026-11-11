import { Entry } from '../domain/types';

export type Operation = { type: 'save_draft' | 'submit'; entry: Entry };

export interface ListRow {
  entry: Entry;
  pending: boolean; // true = still in the queue, shows "Waiting to sync"
}

export interface SyncResult {
  status: 'synced' | 'offline' | 'session_expired';
  keptServerCopy: string[];
}

// TEMPORARY in-memory stub. Replaced by the real queue, fake server and sync engine.
const server: Entry[] = [
  { id: 'srv_1', category: 'inspection', date: '2026-06-01', durationMinutes: 60, note: 'Lobby', status: 'submitted' },
];
let queue: Operation[] = [];

export async function enqueue(op: Operation): Promise<void> {
  queue.push(op);
}

export async function loadEntries(): Promise<Entry[]> {
  return [...server, ...queue.map((o) => o.entry)];
}

export async function loadRows(): Promise<ListRow[]> {
  return [
    ...server.map((entry) => ({ entry, pending: false })),
    ...queue.map((o) => ({ entry: o.entry, pending: true })),
  ];
}

export async function getEntry(id: string): Promise<Entry | null> {
  const rows = await loadRows();
  return rows.find((r) => r.entry.id === id)?.entry ?? null;
}

export async function sync(): Promise<SyncResult> {
  for (const op of queue) {
    server.push({ ...op.entry, status: op.type === 'submit' ? 'submitted' : 'draft' });
  }
  queue = [];
  return { status: 'synced', keptServerCopy: [] };
}