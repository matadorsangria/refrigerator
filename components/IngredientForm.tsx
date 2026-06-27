import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Modal, Keyboard, Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { RoomId } from '../types';

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateJa(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

type Props = {
  title: string;
  initialName?: string;
  initialRoomId?: RoomId;
  initialExpiresAt?: Date;
  onSave: (name: string, roomId: RoomId, expiresAt?: string) => void;
  onCancel: () => void;
};

export function IngredientForm({ title, initialName = '', initialRoomId = 'fridge', initialExpiresAt, onSave, onCancel }: Props) {
  const { rooms } = useApp();

  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId>(initialRoomId);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(initialExpiresAt);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const slideAnim = useRef(new Animated.Value(500)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showDatePicker) {
      slideAnim.setValue(500);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [showDatePicker]);

  const closeModal = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 500, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setShowDatePicker(false);
      callback?.();
    });
  };

  const openPicker = () => {
    setTempDate(expiresAt ?? new Date());
    setShowDatePicker(true);
  };

  const handleConfirm = () => {
    closeModal(() => setExpiresAt(tempDate));
  };

  const handleClear = () => {
    closeModal(() => setExpiresAt(undefined));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('名前を入力してください');
      return;
    }
    onSave(name.trim(), selectedRoomId, expiresAt ? toDateString(expiresAt) : undefined);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Pressable style={styles.headerCancel} onPress={onCancel}>
          <Text style={styles.headerCancelText}>キャンセル</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerCancel} />
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={v => { setName(v); setNameError(''); }}
          placeholder="例：牛乳"
          autoFocus={!initialName}
          returnKeyType="done"
          autoComplete="off"
          importantForAutofill="no"
          contextMenuHidden={true}
        />

        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text style={styles.label}>部屋</Text>
        <View style={styles.roomGrid}>
          {rooms.map(room => (
            <Pressable
              key={room.id}
              style={[styles.roomChip, room.id === selectedRoomId && styles.roomChipSelected]}
              onPress={() => { Keyboard.dismiss(); setSelectedRoomId(room.id); }}
            >
              <Text style={[styles.roomChipText, room.id === selectedRoomId && styles.roomChipTextSelected]}>
                {room.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>賞味期限</Text>
        <Pressable style={styles.dateInput} onPress={() => { Keyboard.dismiss(); openPicker(); }}>
          <Text style={[styles.dateInputText, !expiresAt && styles.dateInputPlaceholder]}>
            {expiresAt ? formatDateJa(expiresAt) : '未設定'}
          </Text>
          <Ionicons name="calendar-outline" size={18} color="#aaa" />
        </Pressable>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>保存</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="none"
        onRequestClose={() => closeModal()}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.modalOverlay, { opacity: overlayOpacity }]} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeModal()} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalToolbar}>
              <Pressable onPress={handleClear} style={styles.toolbarBtn}>
                <Text style={styles.clearText}>クリア</Text>
              </Pressable>
              <Pressable onPress={handleConfirm} style={styles.toolbarBtn}>
                <Text style={styles.confirmText}>決定</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="inline"
              onChange={(_, date) => { if (date) setTempDate(date); }}
              locale="ja"
              style={styles.datePicker}
            />
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    height: 56,
    backgroundColor: '#F2F2F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  headerCancel: { minWidth: 72 },
  headerCancelText: { fontSize: 17, color: '#007AFF' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#C6C6C8',
  },
  roomChipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  roomChipText: { fontSize: 14, color: '#333' },
  roomChipTextSelected: { color: '#fff', fontWeight: '600' },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  dateInputText: { fontSize: 16, color: '#000' },
  dateInputPlaceholder: { color: '#C7C7CC' },
  errorText: { fontSize: 12, color: '#E74C3C' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  toolbarBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  clearText: { fontSize: 15, color: '#E74C3C' },
  confirmText: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  datePicker: { alignSelf: 'center' },
});
