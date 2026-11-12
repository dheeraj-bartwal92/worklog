import { getEntry } from '@/data/api';
import { Entry, formatDuration } from '@/domain/types';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const MSG_NOT_FOUND = 'Entry not found';

export function EntryDetail({ id }: { id: string }) {
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setEntry(undefined);
    getEntry(id).then((e) => { if (alive) setEntry(e); });
    return () => { alive = false; };
  }, [id]);

  if (entry === undefined) return <View testID="detail-loading" />;

  if (entry === null) {
    return (
      <View style={s.wrap}>
        <Text testID="not-found" style={s.title}>{MSG_NOT_FOUND}</Text>
        <Link testID="back-to-list" href="/" style={s.link}>Back to list</Link>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Category</Text>
      <Text testID="detail-category">{entry.category}</Text>
      <Text style={s.label}>Date</Text>
      <Text testID="detail-date">{entry.date}</Text>
      <Text style={s.label}>Duration</Text>
      <Text testID="detail-duration">{formatDuration(entry.durationMinutes)}</Text>
      <Text style={s.label}>Note</Text>
      <Text testID="detail-note">{entry.note || '(no note)'}</Text>
      <Text style={s.label}>Status</Text>
      <Text testID="detail-status">{entry.status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 4 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  label: { fontWeight: '600', marginTop: 10 },
  link: { color: '#0a58ca' },
});