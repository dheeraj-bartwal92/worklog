import { CATEGORIES, DURATION_STEP, Entry, MAX_DURATION, MIN_DURATION } from './types';

export const MSG_STEP = 'Use 15-minute steps';
export const MSG_RANGE = 'Duration must be between 15 minutes and 12 hours';
export const MSG_DUPLICATE = 'You already have this category on this date';

// Assumption: range is checked before step, so 10 and 730 give the range message.
export function validateDuration(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return MSG_RANGE;
  if (value < MIN_DURATION || value > MAX_DURATION) return MSG_RANGE;
  if (!Number.isInteger(value) || value % DURATION_STEP !== 0) return MSG_STEP;
  return null;
}

export function validateDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateCategory(value: unknown): boolean {
  return CATEGORIES.includes(value as (typeof CATEGORIES)[number]);
}

// A warning, not a block: saving is still allowed.
export function hasDuplicate(
  entries: Pick<Entry, 'id' | 'category' | 'date'>[],
  candidate: { id?: string; category: string; date: string },
): boolean {
  return entries.some(
    (e) => e.id !== candidate.id && e.category === candidate.category && e.date === candidate.date,
  );
}