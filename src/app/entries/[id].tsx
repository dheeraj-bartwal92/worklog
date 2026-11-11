import { useLocalSearchParams } from 'expo-router';
import { EntryDetail } from '../../screens/EntryDetail';

export default function EntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EntryDetail id={id} />;
}