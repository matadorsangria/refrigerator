import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../store/AppContext';
import { sortByExpiry } from '../../../utils/expiry';
import { IngredientItem, ingredientListStyles } from '../../../components/IngredientItem';

export default function IngredientsScreen() {
  const { rooms, ingredients, removeIngredient } = useApp();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const sorted = sortByExpiry(ingredients);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.header, { paddingTop: top, height: top + 44 }]}>
        <Text style={styles.headerTitle}>食材</Text>
        <Pressable style={styles.headerAdd} onPress={() => router.push('/ingredient/new')}>
          <Ionicons name="add" size={26} color="#007AFF" />
        </Pressable>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerStyle={ingredientListStyles.content}
        ListEmptyComponent={<Text style={ingredientListStyles.empty}>食材がありません</Text>}
        renderItem={({ item }) => (
          <IngredientItem
            name={item.name}
            quantity={item.quantity}
            expiresAt={item.expiresAt}
            purchasedAt={item.purchasedAt}
            storageDays={item.storageDays}
            roomName={rooms.find(r => r.position === item.roomId)?.name}
            onPress={() => router.push(`/ingredient/${item.id}`)}
            onDelete={() => removeIngredient(item.id)}
          />
        )}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerAdd: {
    position: 'absolute',
    right: 8,
    bottom: 0,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
