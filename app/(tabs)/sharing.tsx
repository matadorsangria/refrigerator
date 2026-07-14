import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Share, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../store/AppContext';

// ─── 招待コード入力 UI（共通）────────────────────────────────────────────────

function JoinSection() {
  const { joinHousehold } = useApp();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError('6文字のコードを入力してください'); return; }
    setError('');
    setJoining(true);
    try {
      await joinHousehold(trimmed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '参加に失敗しました');
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <Text style={styles.label}>招待コードで参加</Text>
      <TextInput
        style={[styles.codeInput, error ? styles.codeInputError : null]}
        value={code}
        onChangeText={v => { setCode(v.toUpperCase()); setError(''); }}
autoCapitalize="characters"
        maxLength={6}
        autoComplete="off"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Pressable style={[styles.secondaryBtn, joining && styles.btnDisabled]} onPress={handleJoin} disabled={joining}>
        {joining
          ? <ActivityIndicator color="#007AFF" size="small" />
          : <Ionicons name="enter-outline" size={18} color="#007AFF" />
        }
        <Text style={styles.secondaryBtnText}>参加する</Text>
      </Pressable>
    </>
  );
}

// ─── 招待済み画面（グループ参加中）──────────────────────────────────────────

function InHouseholdView({ inviteCode, memberCount, memberRole }: { inviteCode: string; memberCount: number; memberRole: 'creator' | 'member' | null }) {
  const handleShare = async () => {
    await Share.share({ message: `冷蔵庫アプリの招待コード: ${inviteCode}` });
  };

  return (
    <>
      <Text style={styles.sectionTitle}>メンバーを招待</Text>
      <Text style={styles.description}>
        このコードを共有すると、相手があなたの冷蔵庫を一緒に管理できます。
      </Text>
      <View style={styles.codeCard}>
        <Text style={styles.codeText}>{inviteCode}</Text>
      </View>
      <Pressable style={styles.primaryBtn} onPress={handleShare}>
        <Ionicons name="share-outline" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>招待コードを共有</Text>
      </Pressable>

      <View style={styles.row}>
        <Ionicons name="people-outline" size={18} color="#6C6C70" />
        <Text style={styles.memberText}>現在のメンバー: {memberCount}人</Text>
      </View>

      {!memberRole && (
        <>
          <View style={styles.divider} />
          <JoinSection />
        </>
      )}
    </>
  );
}

// ─── 未参加画面 ──────────────────────────────────────────────────────────────

function NoHouseholdView() {
  const { createHousehold } = useApp();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createHousehold();
    } catch {
      setError('グループの作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Text style={styles.sectionTitle}>グループを始める</Text>
      <Text style={styles.description}>
        グループを作成して招待コードを発行するか、招待コードを入力して既存のグループに参加できます。
      </Text>

      <Pressable style={[styles.primaryBtn, creating && styles.btnDisabled]} onPress={handleCreate} disabled={creating}>
        {creating
          ? <ActivityIndicator color="#fff" size="small" />
          : <Ionicons name="add-circle-outline" size={18} color="#fff" />
        }
        <Text style={styles.primaryBtnText}>新しいグループを作成</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>または</Text>
        <View style={styles.orLine} />
      </View>

      <JoinSection />
    </>
  );
}

// ─── メイン ──────────────────────────────────────────────────────────────────

export default function SharingScreen() {
  const { householdId, inviteCode, memberCount, memberRole } = useApp();
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.headerTitle}>共有設定</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={22} color="#3C3C43" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {householdId && inviteCode
          ? <InHouseholdView inviteCode={inviteCode} memberCount={memberCount} memberRole={memberRole} />
          : <NoHouseholdView />
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  closeBtn: { position: 'absolute', right: 16, bottom: 12 },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 },
  description: { fontSize: 14, color: '#6C6C70', lineHeight: 20 },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  codeText: { fontSize: 36, fontWeight: '700', letterSpacing: 8, color: '#000' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8', marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberText: { fontSize: 15, color: '#6C6C70' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8' },
  orText: { fontSize: 13, color: '#8E8E93' },
  label: { fontSize: 12, fontWeight: '600', color: '#6C6C70', textTransform: 'uppercase', letterSpacing: 0.5 },
  codeInput: {
    backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 24, fontWeight: '700', letterSpacing: 4,
    textAlign: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#C6C6C8',
  },
  codeInputError: { borderColor: '#E74C3C' },
  errorText: { fontSize: 12, color: '#E74C3C' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#007AFF',
  },
  secondaryBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});
