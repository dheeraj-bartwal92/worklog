import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DevPanel } from '../components/DevPanel';
import { ListRow, loadRows, sync, SyncResult } from '../data/api';
import { formatDuration } from '../domain/types';
export const MSG_WAITING = 'Waiting to sync';
const MSG_OFFLINE = 'Offline: changes are waiting to sync';

export function EntryList() {
  const router = useRouter();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  const refresh = useCallback(async () => setRows(await loadRows()), []);

  const runSync = useCallback(async () => {
    try {
      const r: SyncResult = await sync();
      setBanner(r.status === 'offline' ? MSG_OFFLINE : r.notice);
    } catch {
      setBanner(null);
    }
    await refresh();
  }, [refresh]);

  // One effect: show what is on the device now, then sync, then reload.
  useFocusEffect(
    useCallback(() => {
      void refresh().then(runSync);
    }, [refresh, runSync]),
  );

  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <Pressable testID="new-entry" style={s.btn} onPress={() => router.push('/new')}>
          <Text>New entry</Text>
        </Pressable>
        <Pressable testID="sync-button" style={s.btn} onPress={runSync}>
          <Text>Sync</Text>
        </Pressable>
      </View>
      {banner && <Text testID="banner" style={s.banner}>{banner}</Text>}
      <DevPanel/>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.entry.id}
        ListEmptyComponent={<Text>No entries yet</Text>}
        renderItem={({ item: { entry, pending } }) => (
          <Pressable
            testID={`row-${entry.id}`}
            style={s.row}
            onPress={() => router.push(`/entries/${entry.id}`)}
          >
            <Text style={s.title}>{entry.category} · {entry.date}</Text>
            <Text>{formatDuration(entry.durationMinutes)} · {entry.status}</Text>
            {pending && <Text testID={`waiting-${entry.id}`} style={s.waiting}>{MSG_WAITING}</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  bar: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btn: { borderWidth: 1, borderRadius: 6, padding: 10 },
  banner: { color: '#8a1000', marginBottom: 8, fontSize: 18 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontWeight: '600' },
  waiting: { color: '#8a5a00' },
});