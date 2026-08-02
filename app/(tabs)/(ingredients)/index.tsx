import { useEffect } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../store/AppContext';
import { groupByCategory } from '../../../utils/categories';
import { IngredientItem, ingredientListStyles } from '../../../components/IngredientItem';

export default function IngredientsScreen() {
  const { rooms, ingredients, removeIngredient, unreadByIngredientId, markLogsRead } = useApp();
  const router = useRouter();
  const navigation = useNavigation();
  const { top } = useSafeAreaInsets();
  const sections = groupByCategory(ingredients);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      markLogsRead();
    });
    return unsubscribe;
  }, [navigation, markLogsRead]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.header, { paddingTop: top, height: top + 44 }]}>
        <Text style={styles.headerTitle}>食材</Text>
        <Pressable style={styles.headerAdd} onPress={() => router.push('/ingredient/new')}>
          <Ionicons name="add" size={26} color="#007AFF" />
        </Pressable>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
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
            roomName={rooms.find(r => r.position === item.roomId)?.name}
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
  container: { flex: 1, backgroundColor: '#fff' },
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
