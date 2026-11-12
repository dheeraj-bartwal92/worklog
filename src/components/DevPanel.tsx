import { expireAccessToken, failRetryAfterRefresh, getRefreshCount, setOnline } from '@/api/fakeServer';
import { enqueue } from '@/data/api';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function DevPanel() {
  const [online, setOn] = useState(true);
  const [fail, setFail] = useState(false);

  if (!__DEV__) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.h}>Dev panel (fake server)</Text>

      <Pressable
        testID="toggle-online"
        style={s.btn}
        onPress={() => {
          setOnline(!online);
          setOn(!online);
        }}
      >
        <Text>{online ? 'Go offline' : 'Go online'}</Text>
      </Pressable>

      <Pressable testID="expire-token" style={s.btn} onPress={expireAccessToken}>
        <Text>Expire access token</Text>
      </Pressable>

      <Pressable
        testID="fail-retry"
        style={s.btn}
        onPress={() => {
          failRetryAfterRefresh(!fail);
          setFail(!fail);
        }}
      >
        <Text>Retry after refresh fails: {fail ? 'ON' : 'OFF'}</Text>
      </Pressable>

      <Pressable
        testID="queue-srv1-edit"
        style={s.btn}
        onPress={() =>
          void enqueue({
            type: 'save_draft',
            entry: {
              id: 'srv_1',
              category: 'inspection',
              date: '2026-06-01',
              durationMinutes: 60,
              note: 'Changed locally',
              status: 'draft',
            },
          })
        }
      >
        <Text>Queue local edit for srv_1</Text>
      </Pressable>

      <Text>Refresh count: {getRefreshCount()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderTopWidth: 1, paddingTop: 8, gap: 6 },
  h: { fontWeight: '600' },
  btn: { borderWidth: 1, borderRadius: 6, padding: 8 },
});