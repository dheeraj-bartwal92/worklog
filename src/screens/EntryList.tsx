import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ListRow, loadRows, sync } from '../data/api';
import { formatDuration } from '../domain/types';

export const MSG_WAITING = 'Waiting to sync';
export const MSG_KEPT = 'Server copy kept';
export const MSG_EXPIRED = 'Session expired';
export const MSG_OFFLINE = 'Offline: changes are waiting to sync';

export function EntryList() {
  const router = useRouter();
  const [rows, setRows] = useState<ListRow[]>([]);
  const [banner, setBanner] = useState<string | null>(null);

  const refresh = useCallback(async () => setRows(await loadRows()), []);

  // Reload whenever the list screen gains focus (e.g. back from the form).
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  async function onSync() {
    const result = await sync();
    if (result.status === 'session_expired') setBanner(MSG_EXPIRED);
    else if (result.status === 'offline') setBanner(MSG_OFFLINE);
    else if (result.keptServerCopy.length) setBanner(MSG_KEPT);
    else setBanner(null);
    await refresh();
  }

  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        <Pressable testID="new-entry" style={s.btn} onPress={() => router.push('/new')}>
          <Text>New entry</Text>
        </Pressable>
        <Pressable testID="sync-button" style={s.btn} onPress={onSync}>
          <Text>Sync</Text>
        </Pressable>
      </View>
      {banner && <Text testID="banner" style={s.banner}>{banner}</Text>}
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
  banner: { color: '#8a5a00', marginBottom: 8 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontWeight: '600' },
  waiting: { color: '#8a5a00' },
});