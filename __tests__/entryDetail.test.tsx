import { sync } from '@/domain/sync';
import { EntryDetail } from '@/screens/EntryDetail';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  Link: ({ children, ...p }: any) => {
    const { Text } = require('react-native');
    return <Text {...p}>{children}</Text>;
  },
}));

it('shows srv_1 details', async () => {
  await sync(); // yahan add kiya
  await render(<EntryDetail id="srv_1" />);
  expect(await screen.findByTestId('detail-category')).toHaveTextContent('inspection');
  expect(screen.getByTestId('detail-date')).toHaveTextContent('2026-06-01');
  expect(screen.getByTestId('detail-duration')).toHaveTextContent('1 h');
  expect(screen.getByTestId('detail-note')).toHaveTextContent('Lobby');
  expect(screen.getByTestId('detail-status')).toHaveTextContent('submitted');
});

it('shows Entry not found with a way back for an unknown id', async () => {
  await sync(); // yahan bhi
  await render(<EntryDetail id="nope" />);
  expect(await screen.findByText('Entry not found')).toBeTruthy();
  expect(screen.getByTestId('back-to-list')).toBeTruthy();
});