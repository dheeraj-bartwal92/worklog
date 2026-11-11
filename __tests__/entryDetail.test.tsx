import { render, screen } from '@testing-library/react-native';
import { EntryDetail } from '../src/screens/EntryDetail';

jest.mock('expo-router', () => ({
  Link: ({ children, ...p }: any) => {
    const { Text } = require('react-native');
    return <Text {...p}>{children}</Text>;
  },
}));

it('shows srv_1 details', async () => {
  await render(<EntryDetail id="srv_1" />);
  expect(await screen.findByTestId('detail-category')).toHaveTextContent('inspection');
  expect(screen.getByTestId('detail-date')).toHaveTextContent('2026-06-01');
  expect(screen.getByTestId('detail-duration')).toHaveTextContent('1 h');
  expect(screen.getByTestId('detail-note')).toHaveTextContent('Lobby');
  expect(screen.getByTestId('detail-status')).toHaveTextContent('submitted');
});

it('shows Entry not found with a way back for an unknown id', async () => {
  await render(<EntryDetail id="nope" />);
  expect(await screen.findByText('Entry not found')).toBeTruthy();
  expect(screen.getByTestId('back-to-list')).toBeTruthy();
});