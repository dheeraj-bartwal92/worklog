import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DurationPicker } from '../components/DurationPicker';
import { enqueue, loadEntries, sync } from '../data/api';
import { CATEGORIES, Entry } from '../domain/types';
import { hasDuplicate, MSG_DUPLICATE, validateDate, validateDuration } from '../domain/validation';
import { clearDraftForm, DraftForm, EMPTY_FORM, loadDraftForm, saveDraftForm } from '../storage/draftForm';

type Errors = Partial<Record<'category' | 'date' | 'duration', string>>;

const newId = () => `loc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function EntryForm() {
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);

  // Restore before the first real render, so we never show or save an empty form by mistake.
  useEffect(() => {
    let alive = true;
    loadDraftForm().then((saved) => {
      if (!alive) return;
      if (saved) setForm(saved);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // Persist in the change handler, not an effect: clearing must not re-create draft_form.
  function update(patch: Partial<DraftForm>) {
    const next = { ...form, ...patch };
    setForm(next);
    setNotice(null);
    void saveDraftForm(next);
  }

  function validate(): Errors {
    const e: Errors = {};
    // Assumption: these three messages are mine, the brief does not specify them.
    if (!form.category) e.category = 'Select a category';
    if (!validateDate(form.date)) e.date = 'Enter a date as YYYY-MM-DD';
    if (form.durationMinutes === null) e.duration = 'Select a duration';
    else e.duration = validateDuration(form.durationMinutes) ?? undefined;
    return Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors;
  }

  async function submit(type: 'save_draft' | 'submit') {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const existing = await loadEntries();
    const dup = hasDuplicate(existing, { category: form.category!, date: form.date });
    const entry: Entry = {
      id: newId(),
      category: form.category!,
      date: form.date,
      durationMinutes: form.durationMinutes!,
      note: form.note,
      status: 'draft',
    };
    await enqueue({ type, entry });
    // Assumption: after queueing, the form clears and draft_form is removed.
    await clearDraftForm();
    setForm(EMPTY_FORM);
    // Duplicate is a warning, never a block.
    setNotice(dup ? MSG_DUPLICATE : type === 'submit' ? 'Submit queued' : 'Draft saved');
    sync().catch(() => {}); // both actions try to sync straight away
  }

  async function clearDraft() {
    await clearDraftForm();
    setForm(EMPTY_FORM);
    setErrors({});
    setNotice(null);
  }

  if (!loaded) return <View testID="form-loading" />;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.label}>Category</Text>
      <View style={s.row}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            testID={`category-${c}`}
            style={[s.chip, form.category === c && s.chipOn]}
            onPress={() => update({ category: c })}
          >
            <Text>{c}</Text>
          </Pressable>
        ))}
      </View>
      {errors.category && <Text style={s.error}>{errors.category}</Text>}

      <Text style={s.label}>Date</Text>
      <TextInput
        testID="date-input"
        style={s.input}
        placeholder="YYYY-MM-DD"
        value={form.date}
        onChangeText={(date) => update({ date })}
        autoCapitalize="none"
      />
      {errors.date && <Text style={s.error}>{errors.date}</Text>}

      <Text style={s.label}>Duration</Text>
      <DurationPicker value={form.durationMinutes} onChange={(m) => update({ durationMinutes: m })} />
      {errors.duration && <Text style={s.error}>{errors.duration}</Text>}

      <Text style={s.label}>Note</Text>
      <TextInput
        testID="note-input"
        style={[s.input, { height: 80 }]}
        multiline
        value={form.note}
        onChangeText={(note) => update({ note })}
      />

      {notice && <Text testID="notice" style={s.notice}>{notice}</Text>}

      <View style={s.row}>
        <Pressable testID="save-draft" style={s.btn} onPress={() => submit('save_draft')}><Text>Save draft</Text></Pressable>
        <Pressable testID="submit" style={s.btn} onPress={() => submit('submit')}><Text>Submit</Text></Pressable>
        <Pressable testID="clear-draft" style={s.btn} onPress={clearDraft}><Text>Clear draft</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: '#999', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { backgroundColor: '#cfe0ff' },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 10 },
  error: { color: '#b00020' },
  notice: { color: '#8a5a00', marginTop: 8 },
  btn: { borderWidth: 1, borderRadius: 6, padding: 10, marginTop: 12 },
});