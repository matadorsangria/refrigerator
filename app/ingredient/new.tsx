import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { IngredientForm } from '../../components/IngredientForm';

export default function NewIngredientScreen() {
  const { roomId: defaultRoomId, name: defaultName } = useLocalSearchParams<{ roomId?: string; name?: string }>();
  const { addIngredient } = useApp();
  const router = useRouter();

  return (
    <IngredientForm
      title="食材を追加"
      initialName={defaultName}
      initialRoomId={defaultRoomId ? parseInt(defaultRoomId, 10) : 1}
      onSave={(name, roomId, expiresAt, purchasedAt, storageDays, quantity, unit, category) => {
        addIngredient(name, roomId, expiresAt, purchasedAt, storageDays, quantity, unit, category);
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
