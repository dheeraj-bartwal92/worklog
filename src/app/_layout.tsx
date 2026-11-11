import { sync } from '@/domain/sync';
import { ensureSeeded } from '@/storage/tokens';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await ensureSeeded();
        await sync(); // srv_1 cache mein aa jaye, cold start par "not found" na dikhe
      } catch {
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!ready) return <View testID="booting" />;
  return (
    <Stack screenOptions={{ headerTransparent: false, headerBlurEffect: 'none' }}>
      <Stack.Screen name="index" options={{ title: 'Work log' }} />
      <Stack.Screen name="new" options={{ title: 'New entry' }} />
      <Stack.Screen name="entries/[id]" options={{ title: 'Entry' }} />
    </Stack>
  );
}