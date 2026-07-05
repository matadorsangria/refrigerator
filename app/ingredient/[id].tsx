import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { IngredientForm } from '../../components/IngredientForm';

function parseDate(str?: string): Date | undefined {
  if (!str) return undefined;
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

export default function EditIngredientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ingredients, updateIngredient, removeIngredient } = useApp();
  const router = useRouter();

  const ingredient = ingredients.find(i => i.id === id);

  if (!ingredient) {
    return <View><Text>食材が見つかりません</Text></View>;
  }

  return (
    <IngredientForm
      title="食材を編集"
      initialName={ingredient.name}
      initialRoomId={ingredient.roomId}
      initialPurchasedAt={parseDate(ingredient.purchasedAt)}
      initialExpiresAt={parseDate(ingredient.expiresAt)}
      onSave={(name, roomId, expiresAt, purchasedAt) => {
        updateIngredient(id, name, roomId, expiresAt, purchasedAt);
        router.back();
      }}
      onCancel={() => router.back()}
      onDelete={() => { removeIngredient(id); router.back(); }}
    />
  );
}
