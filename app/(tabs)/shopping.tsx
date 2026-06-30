import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, Keyboard, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../store/AppContext';

function AddModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addShoppingItem } = useApp();
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addShoppingItem(name.trim());
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>買うものを追加</Text>
          <TextInput
            style={styles.modalInput}
            value={name}
            onChangeText={setName}
            placeholder="例：牛乳"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            autoComplete="off"
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={() => { setName(''); onClose(); }}>
              <Text style={styles.cancelBtnText}>キャンセル</Text>
            </Pressable>
            <Pressable style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]} onPress={handleAdd} disabled={!name.trim()}>
              <Text style={styles.addBtnText}>追加</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ShoppingScreen() {
  const { shoppingItems, removeShoppingItem } = useApp();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(`「${name}」を食材に追加しますか？`, '', [
      { text: 'いいえ', onPress: () => removeShoppingItem(id) },
      { text: 'はい', style: 'default', onPress: () => {
        removeShoppingItem(id);
        router.push({ pathname: '/ingredient/new', params: { name } });
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: top, height: top + 44 }]}>
        <Text style={styles.headerTitle}>買うもの</Text>
        <Pressable style={styles.headerAdd} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={26} color="#007AFF" />
        </Pressable>
      </View>

      <FlatList
        data={shoppingItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>買うものがありません</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color="#C0C0C0" />
            </Pressable>
          </View>
        )}
      />

      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
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
  listContent: { paddingVertical: 6, paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  itemName: { fontSize: 16, color: '#333', flex: 1 },
  deleteBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#000', textAlign: 'center' },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#F2F2F7', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, color: '#333' },
  addBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#007AFF', alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
