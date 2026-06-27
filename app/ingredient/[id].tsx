import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { RoomId } from '../../types';
import { IngredientForm } from '../../components/IngredientForm';

function parseDate(str?: string): Date | undefined {
  if (!str) return undefined;
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

export default function EditIngredientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ingredients, updateIngredient } = useApp();
  const router = useRouter();

  const ingredient = ingredients.find(i => i.id === id);

  if (!ingredient) {
    return <View><Text>食材が見つかりません</Text></View>;
  }

  return (
    <IngredientForm
      title="食材を編集"
      initialName={ingredient.name}
      initialRoomId={ingredient.roomId as RoomId}
      initialExpiresAt={parseDate(ingredient.expiresAt)}
      onSave={(name, roomId, expiresAt) => {
        updateIngredient(id, name, roomId, expiresAt);
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
