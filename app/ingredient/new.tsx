import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { IngredientForm } from '../../components/IngredientForm';

export default function NewIngredientScreen() {
  const { roomId: defaultRoomId } = useLocalSearchParams<{ roomId?: string }>();
  const { addIngredient } = useApp();
  const router = useRouter();

  return (
    <IngredientForm
      title="食材を追加"
      initialRoomId={defaultRoomId ? parseInt(defaultRoomId, 10) : 1}
      onSave={(name, roomId, expiresAt) => {
        addIngredient(name, roomId, expiresAt);
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
