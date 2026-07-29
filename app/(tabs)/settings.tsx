import { View, Text, Pressable, StyleSheet, Platform, DevSettings } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useApp } from '../../store/AppContext';

function Row({ icon, label, value, chevron = true, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  chevron?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color="#007AFF" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {chevron && <Ionicons name="chevron-forward" size={16} color="#C6C6C8" />}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { householdId, memberCount } = useApp();

  const sharingValue = householdId
    ? `${memberCount}人のメンバー`
    : '未設定';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: top, height: top + 44 }]}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>アプリ</Text>
        <View style={styles.card}>
          <Row
            icon="time-outline"
            label="変更履歴"
            onPress={() => router.push('/changelog')}
          />
          <View style={styles.divider} />
          <Row
            icon="refresh-outline"
            label="再読み込み"
            chevron={false}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.location.reload();
              } else if (__DEV__) {
                DevSettings.reload();
              } else {
                Updates.reloadAsync();
              }
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>共有</Text>
        <View style={styles.card}>
          <Row
            icon="people-outline"
            label="共有・招待"
            value={sharingValue}
            onPress={() => router.push('/sharing')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#fff',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center', color: '#000' },
  section: { marginTop: 20, paddingHorizontal: 16, gap: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 16, color: '#000' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15, color: '#8E8E93' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8', marginLeft: 48 },
});
