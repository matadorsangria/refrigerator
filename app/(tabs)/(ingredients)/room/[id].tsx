import { useEffect } from 'react';
import { Pressable, View, Text, SectionList, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../../store/AppContext';
import { groupByCategory } from '../../../../utils/categories';
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
  const { rooms, ingredients, removeIngredient, unreadByIngredientId, markLogsRead } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  const room = rooms.find(r => r.id === id);
  const sections = groupByCategory(ingredients.filter(i => i.roomId === room?.position));

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (room?.position != null) markLogsRead(room.position);
    });
    return unsubscribe;
  }, [navigation, markLogsRead]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      <RoomHeader
        title={room?.name ?? '食材'}
        onBack={() => navigation.getParent()?.navigate('(home)' as never)}
        onAdd={() => router.push({ pathname: '/ingredient/new', params: { roomId: room?.position } })}
      />
      <SectionList
        style={styles.list}
        sections={sections}
        keyExtractor={item => item.id}
        automaticallyAdjustContentInsets={false}
        ListEmptyComponent={<Text style={ingredientListStyles.empty}>食材がありません</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <IngredientItem
            name={item.name}
            quantity={item.quantity}
            unit={item.unit}
            expiresAt={item.expiresAt}
            purchasedAt={item.purchasedAt}
            storageDays={item.storageDays}
            roomName={room?.name}
            badgeStatus={unreadByIngredientId[item.id]}
            onPress={() => router.push(`/ingredient/${item.id}`)}
            onDelete={() => removeIngredient(item.id)}
          />
        )}
      />
    </GestureHandlerRootView>
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
  container: { flex: 1, backgroundColor: '#fff' },
  list: { flex: 1, backgroundColor: '#fff' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
  },
});
