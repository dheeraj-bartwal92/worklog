export const CATEGORIES = ['inspection', 'repair', 'travel'] as const;
export const STATUSES = ['draft', 'submitted'] as const;

export type Category = (typeof CATEGORIES)[number];

export type Status = (typeof STATUSES)[number];

export type Entry = {
    id: string;
    category: Category;
    date: string;
    durationMinutes: number;
    note: string;
    status: Status;
}


export const MIN_DURATION = 15;
export const MAX_DURATION = 720;
export const DURATION_STEP = 15;

export const DURATION_OPTIONS: number[] = Array.from(
    {length: MAX_DURATION / DURATION_STEP },
    (_, i) => (i+1) * DURATION_STEP
)

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}