import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearDraftForm, DRAFT_FORM_KEY, loadDraftForm, saveDraftForm } from '../src/storage/draftForm';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => AsyncStorage.clear());

const form = { category: 'repair' as const, date: '2026-06-02', durationMinutes: 90, note: 'Pump' };

it('restores the saved form', async () => {
  await saveDraftForm(form);
  expect(await loadDraftForm()).toEqual(form);
});

it('clear removes draft_form', async () => {
  await saveDraftForm(form);
  await clearDraftForm();
  expect(await AsyncStorage.getItem(DRAFT_FORM_KEY)).toBeNull();
  expect(await loadDraftForm()).toBeNull();
});

it('resets invalid restored fields', async () => {
  await AsyncStorage.setItem(DRAFT_FORM_KEY, JSON.stringify({ ...form, durationMinutes: 20, category: 'x' }));
  const r = await loadDraftForm();
  expect(r?.durationMinutes).toBeNull();
  expect(r?.category).toBeNull();
});

it('survives corrupt JSON', async () => {
  await AsyncStorage.setItem(DRAFT_FORM_KEY, '{oops');
  expect(await loadDraftForm()).toBeNull();
});