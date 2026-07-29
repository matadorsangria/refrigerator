import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { IngredientLog } from '../types';

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${M}/${D} ${h}:${m}`;
}

function logText(log: IngredientLog): string {
  if (log.action === 'add') return `${log.ingredientName}を追加しました`;
  if (log.action === 'delete') return `${log.ingredientName}を削除しました`;
  return `${log.ingredientName}を${log.quantity}${log.unit}に更新しました`;
}

const ACTION_ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  add: { name: 'add-circle-outline', color: '#27AE60' },
  delete: { name: 'remove-circle-outline', color: '#E74C3C' },
  update: { name: 'swap-horizontal-outline', color: '#F39C12' },
};

export default function ChangelogScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { logs } = useApp();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { height: top + 34 }]}>
        <Text style={styles.headerTitle}>変更履歴</Text>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>閉じる</Text>
        </Pressable>
      </View>

      <FlatList
        data={logs}
        keyExtractor={l => l.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottom + 16 }]}
        ListEmptyComponent={<Text style={styles.empty}>変更履歴はありません</Text>}
        renderItem={({ item }) => {
          const icon = ACTION_ICON[item.action];
          return (
            <View style={styles.row}>
              <Ionicons name={icon.name} size={20} color={icon.color} style={styles.icon} />
              <View style={styles.rowContent}>
                <Text style={styles.rowText}>{logText(item)}</Text>
                <Text style={styles.rowTime}>{formatDateTime(item.createdAt)}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', textAlign: 'center', color: '#000' },
  closeBtn: { position: 'absolute', right: 16, bottom: 16 },
  closeBtnText: { fontSize: 17, color: '#007AFF' },
  list: { paddingTop: 16, paddingHorizontal: 16, gap: 2 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 2,
  },
  icon: { marginRight: 12 },
  rowContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowText: { flex: 1, fontSize: 15, color: '#000' },
  rowTime: { fontSize: 12, color: '#8E8E93' },
});
