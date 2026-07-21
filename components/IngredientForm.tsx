import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Modal, Keyboard, Animated, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { RoomId } from '../types';

const QUANTITY_VALUES = [0, ...Array.from({ length: 40 }, (_, i) => 0.5 + i * 0.5)];
const UNIT_VALUES = ['個', '本', '枚', '束', '袋', 'パック'];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateJa(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

const ROOM_COLORS: Record<number, { bg: string; border: string }> = {
  1: { bg: '#EBF5FB', border: '#A9CCE3' },
  2: { bg: '#EAFAF1', border: '#A9DFBF' },
  4: { bg: '#D6EAF8', border: '#A9CCE3' },
  5: { bg: '#C5E2F5', border: '#85C1E9' },
  6: { bg: '#FEF3E2', border: '#F5A623' },
};

type Props = {
  title: string;
  initialName?: string;
  initialRoomId?: RoomId;
  initialQuantity?: number;
  initialUnit?: string;
  initialPurchasedAt?: Date;
  initialStorageDays?: number;
  initialExpiresAt?: Date;
  onSave: (name: string, roomId: RoomId, expiresAt?: string, purchasedAt?: string, storageDays?: number, quantity?: number, unit?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

export function IngredientForm({ title, initialName = '', initialRoomId = 1, initialQuantity, initialUnit, initialPurchasedAt, initialStorageDays, initialExpiresAt, onSave, onCancel, onDelete }: Props) {
  const { rooms, addShoppingItem } = useApp();
  const { top } = useSafeAreaInsets();

  const nameInputRef = useRef<TextInput>(null);
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId>(initialRoomId);
  const [quantity, setQuantity] = useState<number>(initialQuantity ?? 1);
  const [unit, setUnit] = useState<string>(initialUnit ?? '個');
  const [purchasedAt, setPurchasedAt] = useState<Date | undefined>(initialPurchasedAt ?? new Date());
  const [storageDays, setStorageDays] = useState(initialStorageDays != null ? String(initialStorageDays) : '');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(initialExpiresAt);
  const [pickerFor, setPickerFor] = useState<'purchase' | 'expiry' | 'quantity' | 'unit' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempQuantity, setTempQuantity] = useState<number>(1);
  const [tempUnit, setTempUnit] = useState<string>('個');
  const slideAnim = useRef(new Animated.Value(500)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!initialName) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (pickerFor !== null) {
      slideAnim.setValue(500);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [pickerFor]);

  const closeModal = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 500, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setPickerFor(null);
      callback?.();
    });
  };

  const openPicker = (target: 'purchase' | 'expiry' | 'quantity' | 'unit') => {
    if (target === 'quantity') setTempQuantity(quantity);
    else if (target === 'unit') setTempUnit(unit);
    else setTempDate((target === 'expiry' ? expiresAt : purchasedAt) ?? new Date());
    setPickerFor(target);
  };

  const handleConfirm = () => {
    closeModal(() => {
      if (pickerFor === 'expiry') setExpiresAt(tempDate);
      else if (pickerFor === 'purchase') setPurchasedAt(tempDate);
      else if (pickerFor === 'quantity') setQuantity(tempQuantity);
      else if (pickerFor === 'unit') setUnit(tempUnit);
    });
  };

  const handleClear = () => {
    closeModal(() => {
      if (pickerFor === 'expiry') setExpiresAt(undefined);
      else if (pickerFor === 'purchase') setPurchasedAt(undefined);
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('名前を入力してください');
      return;
    }
    const days = storageDays.trim() ? parseInt(storageDays, 10) : undefined;
    onSave(name.trim(), selectedRoomId, expiresAt ? toDateString(expiresAt) : undefined, purchasedAt ? toDateString(purchasedAt) : undefined, days, quantity, unit);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: top, height: top + 56 }]}>
        <Pressable style={styles.headerCancel} onPress={onCancel}>
          <Text style={styles.headerCancelText}>キャンセル</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        {onDelete ? (
          <Pressable
            style={styles.headerCancel}
            onPress={() => Alert.alert(`「${name}」を買うものに追加しますか？`, '', [
              { text: 'いいえ', onPress: onDelete },
              { text: 'はい', onPress: () => { addShoppingItem(name); onDelete?.(); } },
            ])}
          >
            <Ionicons name="trash-outline" size={22} color="#E74C3C" />
          </Pressable>
        ) : (
          <View style={styles.headerCancel} />
        )}
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <Text style={styles.label}>名前</Text>
        <TextInput
          ref={nameInputRef}
          style={styles.input}
          value={name}
          onChangeText={v => { setName(v); setNameError(''); }}
          placeholder="例：牛乳"
          returnKeyType="done"
          returnKeyLabel="完了"
          autoComplete="off"
          importantForAutofill="no"
          contextMenuHidden={true}
        />

        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text style={styles.label}>場所</Text>
        <View style={styles.roomGrid}>
          {rooms.filter(r => r.active).map(room => {
            const selected = room.position === selectedRoomId;
            const color = ROOM_COLORS[room.position];
            return (
              <Pressable
                key={room.position}
                style={[
                  styles.roomChip,
                  selected && (color
                    ? { backgroundColor: color.bg, borderColor: color.border }
                    : styles.roomChipSelected),
                ]}
                onPress={() => { Keyboard.dismiss(); setSelectedRoomId(room.position); }}
              >
                <Text style={[styles.roomChipText, selected && styles.roomChipTextSelected]}>
                  {room.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>数量 / 単位</Text>
        <View style={styles.quantityRow}>
          <Pressable style={[styles.dateInput, styles.quantityInput]} onPress={() => { Keyboard.dismiss(); openPicker('quantity'); }}>
            <Text style={styles.dateInputText}>{quantity}</Text>
            <Ionicons name="chevron-down" size={18} color="#aaa" />
          </Pressable>
          <Pressable style={[styles.dateInput, styles.unitInputFlex]} onPress={() => { Keyboard.dismiss(); openPicker('unit'); }}>
            <Text style={styles.dateInputText}>{unit}</Text>
            <Ionicons name="chevron-down" size={18} color="#aaa" />
          </Pressable>
        </View>

        <View style={styles.purchasedAtRow}>
          <View style={[styles.purchasedAtCol, styles.purchasedAtColWide]}>
            <Text style={styles.label}>購入日</Text>
            <Pressable style={styles.dateInput} onPress={() => { Keyboard.dismiss(); openPicker('purchase'); }}>
              <Text style={[styles.dateInputText, !purchasedAt && styles.dateInputPlaceholder]}>
                {purchasedAt ? formatDateJa(purchasedAt) : '未設定'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#aaa" />
            </Pressable>
          </View>
          {purchasedAt && (
            <View style={[styles.purchasedAtCol, styles.purchasedAtColNarrow]}>
              <Text style={styles.label}>保存期限</Text>
              <View style={styles.storageDaysRow}>
                <TextInput
                  style={styles.storageDaysInput}
                  value={storageDays}
                  onChangeText={v => setStorageDays(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  returnKeyLabel="完了"
                />
                <Text style={styles.storageDaysUnit}>日</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.label}>賞味期限</Text>
        <Pressable style={styles.dateInput} onPress={() => { Keyboard.dismiss(); openPicker('expiry'); }}>
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
        visible={pickerFor !== null}
        transparent
        animationType="none"
        onRequestClose={() => closeModal()}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.modalOverlay, { opacity: overlayOpacity }]} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeModal()} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalToolbar}>
              {pickerFor !== 'quantity' && pickerFor !== 'unit' ? (
                <Pressable onPress={handleClear} style={styles.toolbarBtn}>
                  <Text style={styles.clearText}>クリア</Text>
                </Pressable>
              ) : <View style={styles.toolbarBtn} />}
              <Pressable onPress={handleConfirm} style={styles.toolbarBtn}>
                <Text style={styles.confirmText}>決定</Text>
              </Pressable>
            </View>
            {pickerFor === 'quantity' ? (
              <Picker
                selectedValue={tempQuantity}
                onValueChange={v => setTempQuantity(v)}
                style={styles.quantityPicker}
              >
                {QUANTITY_VALUES.map(v => (
                  <Picker.Item key={v} label={`${v}`} value={v} />
                ))}
              </Picker>
            ) : pickerFor === 'unit' ? (
              <Picker
                selectedValue={tempUnit}
                onValueChange={v => setTempUnit(v)}
                style={styles.quantityPicker}
              >
                {UNIT_VALUES.map(u => (
                  <Picker.Item key={u} label={u} value={u} />
                ))}
              </Picker>
            ) : (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={(_, date) => { if (date) setTempDate(date); }}
                locale="ja"
                style={styles.datePicker}
              />
            )}
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
  headerCancel: { minWidth: 72, alignItems: 'flex-end' },
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
  roomChipSelected: { backgroundColor: '#a3cdfa', borderColor: '#a3cdfa' },
  roomChipText: { fontSize: 14, color: '#333' },
  roomChipTextSelected: { color: '#333', fontWeight: '600' },
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
  quantityPicker: { width: '100%' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityInput: { width: 90 },
  unitInputFlex: { flex: 1 },
  purchasedAtRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  purchasedAtCol: { gap: 6 },
  purchasedAtColWide: { flex: 3 },
  purchasedAtColNarrow: { flex: 2 },
  storageDaysRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storageDaysInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  storageDaysUnit: { fontSize: 16, color: '#333' },
});
