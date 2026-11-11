import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Work log' }} />
      <Stack.Screen name="new" options={{ title: 'New entry' }} />
      <Stack.Screen name="entries/[id]" options={{ title: 'Entry' }} />
    </Stack>
  );
}