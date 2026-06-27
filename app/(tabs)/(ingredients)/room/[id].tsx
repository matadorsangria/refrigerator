import { Pressable, View, Text, FlatList, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../../store/AppContext';
import { RoomId } from '../../../../types';
import { sortByExpiry } from '../../../../utils/expiry';
import { IngredientItem, ingredientListStyles } from '../../../../components/IngredientItem';

function RoomHeader({ title, onBack, onAdd }: { title: string; onBack: () => void; onAdd: () => void }) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: top, height: top + 44 }]}>
      <Pressable onPress={onBack} style={styles.headerBack}>
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
        <Text style={styles.headerBackText}>ホーム</Text>
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <Pressable onPress={onAdd} style={styles.headerAdd}>
        <Ionicons name="add" size={26} color="#007AFF" />
      </Pressable>
    </View>
  );
}

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, ingredients } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  const room = rooms.find(r => r.id === (id as RoomId));
  const sorted = sortByExpiry(ingredients.filter(i => i.roomId === (id as RoomId)));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      <RoomHeader
        title={room?.name ?? '食材'}
        onBack={() => navigation.getParent()?.navigate('(home)' as never)}
        onAdd={() => router.push({ pathname: '/ingredient/new', params: { roomId: id } })}
      />
      <FlatList
        style={styles.list}
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerStyle={ingredientListStyles.content}
        automaticallyAdjustContentInsets={false}
        ListEmptyComponent={<Text style={ingredientListStyles.empty}>食材がありません</Text>}
        renderItem={({ item }) => (
          <IngredientItem
            name={item.name}
            expiresAt={item.expiresAt}
            roomName={room?.name}
            onPress={() => router.push(`/ingredient/${item.id}`)}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  headerBackText: { color: '#007AFF', fontSize: 17 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerAdd: {
    minWidth: 80,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  list: { flex: 1, backgroundColor: '#fff' },
});
