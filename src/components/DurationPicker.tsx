import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DURATION_OPTIONS, formatDuration } from '../domain/types';

interface Props {
  value: number | null;
  onChange: (minutes: number) => void;
}

export function DurationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable testID="duration-trigger" style={s.trigger} onPress={() => setOpen(true)}>
        <Text>{value === null ? 'Select a duration' : formatDuration(value)}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.modal}>
          <FlatList
            data={DURATION_OPTIONS}
            keyExtractor={(m) => String(m)}
            renderItem={({ item }) => (
              <Pressable
                testID={`duration-option-${item}`}
                style={[s.row, item === value && s.selected]}
                onPress={() => { onChange(item); setOpen(false); }}
              >
                <Text>{formatDuration(item)}</Text>
              </Pressable>
            )}
          />
          <Pressable style={s.close} onPress={() => setOpen(false)}>
            <Text>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  trigger: { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 12 },
  modal: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  row: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  selected: { backgroundColor: '#e6f0ff' },
  close: { padding: 16, alignItems: 'center' },
});