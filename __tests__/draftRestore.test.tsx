import { EntryForm } from '@/screens/EntryForm';
import { DRAFT_FORM_KEY } from '@/storage/draftForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

async function fillForm() {
  await screen.findByTestId('date-input');
  await fireEvent.press(screen.getByTestId('category-repair'));
  await fireEvent.changeText(screen.getByTestId('date-input'), '2026-06-02');
  await fireEvent.press(screen.getByTestId('duration-trigger'));
  await fireEvent.press(await screen.findByTestId('duration-option-90'));
  await fireEvent.changeText(screen.getByTestId('note-input'), 'Pump');
}

it('restores category, date, duration and note after remount', async () => {
  const first = await render(<EntryForm />);
  await fillForm();
  await first.unmount();

  await render(<EntryForm />);
  await waitFor(() =>
    expect(screen.getByTestId('date-input').props.value).toBe('2026-06-02'),
  );
  expect(screen.getByTestId('note-input').props.value).toBe('Pump');
  expect(screen.getByText('1 h 30 min')).toBeTruthy();
  const saved = JSON.parse((await AsyncStorage.getItem(DRAFT_FORM_KEY))!);
  expect(saved.category).toBe('repair');
});

it('Clear draft empties the form and removes draft_form', async () => {
  await render(<EntryForm />);
  await fillForm();
  await fireEvent.press(screen.getByTestId('clear-draft'));
  await waitFor(() => expect(screen.getByTestId('date-input').props.value).toBe(''));
  expect(screen.getByTestId('note-input').props.value).toBe('');
  expect(screen.getByText('Select a duration')).toBeTruthy();
  expect(await AsyncStorage.getItem(DRAFT_FORM_KEY)).toBeNull();
});