import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Entry } from '../domain/types';
import { validateCategory, validateDate, validateDuration } from '../domain/validation';

export const DRAFT_FORM_KEY = "draft_form";

export type DraftForm = Omit<
  Entry,
  'id' | 'status' | 'category' | 'durationMinutes'
> & {
  category: Category | null;
  durationMinutes: number | null;
};

export const EMPTY_FORM: DraftForm = {
  category: null,
  date: '',
  durationMinutes: null,
  note: '',
};

export async function saveDraftForm(form: DraftForm): Promise<void> {
  await AsyncStorage.setItem(DRAFT_FORM_KEY, JSON.stringify(form));
}

export async function clearDraftForm(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_FORM_KEY);
}

export async function loadDraftForm(): Promise<DraftForm | null> {
  const raw = await AsyncStorage.getItem(DRAFT_FORM_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return {
      category: validateCategory(p.category) ? p.category : null,
      date: validateDate(p.date) ? p.date : '',
      durationMinutes: validateDuration(p.durationMinutes) === null ? p.durationMinutes : null,
      note: typeof p.note === 'string' ? p.note : '',
    };
  } catch {
    return null;
  }
}


