import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Modal, Keyboard, Animated, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { RoomId } from '../types';
import { CATEGORY_VALUES } from '../utils/categories';

const QUANTITY_VALUES = [0, ...Array.from({ length: 40 }, (_, i) => 0.5 + i * 0.5)];
const UNIT_VALUES = ['個', '本', '枚', '束', '袋', 'パック'];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_SIZE = Math.round(SCREEN_WIDTH * 0.65);
const FRAME_LEFT = (SCREEN_WIDTH - FRAME_SIZE) / 2;
const FRAME_TOP = (SCREEN_HEIGHT - FRAME_SIZE) / 2 - 60;

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
  initialCategory?: string;
  initialQuantity?: number;
  initialUnit?: string;
  initialPurchasedAt?: Date;
  initialStorageDays?: number;
  initialExpiresAt?: Date;
  onSave: (name: string, roomId: RoomId, expiresAt?: string, purchasedAt?: string, storageDays?: number, quantity?: number, unit?: string, category?: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

export function IngredientForm({ title, initialName = '', initialRoomId = 1, initialCategory, initialQuantity, initialUnit, initialPurchasedAt, initialStorageDays, initialExpiresAt, onSave, onCancel, onDelete }: Props) {
  const { rooms, addShoppingItem } = useApp();
  const { top } = useSafeAreaInsets();

  const nameInputRef = useRef<TextInput>(null);
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId>(initialRoomId);
  const [category, setCategory] = useState<string>(initialCategory ?? '');
  const [quantity, setQuantity] = useState<number>(initialQuantity ?? 1);
  const [unit, setUnit] = useState<string>(initialUnit ?? '個');
  const [purchasedAt, setPurchasedAt] = useState<Date | undefined>(initialPurchasedAt ?? new Date());
  const [storageDays, setStorageDays] = useState(initialStorageDays != null ? String(initialStorageDays) : '');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(initialExpiresAt);
  const [pickerFor, setPickerFor] = useState<'purchase' | 'expiry' | 'quantity' | 'unit' | 'category' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempQuantity, setTempQuantity] = useState<number>(1);
  const [tempUnit, setTempUnit] = useState<string>('個');
  const [tempCategory, setTempCategory] = useState<string>('その他');
  const [showCamera, setShowCamera] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const scannedRef = useRef(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
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

  const openPicker = (target: 'purchase' | 'expiry' | 'quantity' | 'unit' | 'category') => {
    if (target === 'quantity') setTempQuantity(quantity);
    else if (target === 'unit') setTempUnit(unit);
    else if (target === 'category') setTempCategory(category || CATEGORY_VALUES[0]);
    else setTempDate((target === 'expiry' ? expiresAt : purchasedAt) ?? new Date());
    setPickerFor(target);
  };

  const handleConfirm = () => {
    closeModal(() => {
      if (pickerFor === 'expiry') setExpiresAt(tempDate);
      else if (pickerFor === 'purchase') setPurchasedAt(tempDate);
      else if (pickerFor === 'quantity') setQuantity(tempQuantity);
      else if (pickerFor === 'unit') setUnit(tempUnit);
      else if (pickerFor === 'category') { setCategory(tempCategory); setCategoryError(''); }
    });
  };

  const handleClear = () => {
    closeModal(() => {
      if (pickerFor === 'expiry') setExpiresAt(undefined);
      else if (pickerFor === 'purchase') setPurchasedAt(undefined);
    });
  };

  const [categoryError, setCategoryError] = useState('');

  const handleOpenCamera = async () => {
    Keyboard.dismiss();
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('カメラへのアクセスが必要です', '設定からカメラの使用を許可してください');
        return;
      }
    }
    scannedRef.current = false;
    setShowCamera(true);
  };

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setIsLookingUp(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('lookup-barcode', { body: { barcode: data } });
      setShowCamera(false);
      setIsLookingUp(false);
      if (error || !result?.name) {
        Alert.alert('商品が見つかりませんでした');
        return;
      }
      setName(result.name);
      setNameError('');
      if (result.category) {
        setCategory(result.category);
        setCategoryError('');
      }
    } catch {
      setShowCamera(false);
      setIsLookingUp(false);
      Alert.alert('商品が見つかりませんでした');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('名前を入力してください');
      return;
    }
    if (!category) {
      setCategoryError('カテゴリを選択してください');
      return;
    }
    const days = storageDays.trim() ? parseInt(storageDays, 10) : undefined;
    onSave(name.trim(), selectedRoomId, expiresAt ? toDateString(expiresAt) : undefined, purchasedAt ? toDateString(purchasedAt) : undefined, days, quantity, unit, category);
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
          <Pressable style={styles.headerCancel} onPress={handleOpenCamera}>
            <Ionicons name="barcode-outline" size={26} color="#007AFF" />
          </Pressable>
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

        <Text style={styles.label}>カテゴリ</Text>
        <Pressable style={styles.dateInput} onPress={() => { Keyboard.dismiss(); openPicker('category'); }}>
          <Text style={[styles.dateInputText, !category && styles.dateInputPlaceholder]}>
            {category || '選択してください'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#aaa" />
        </Pressable>
        {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

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
              {pickerFor !== 'quantity' && pickerFor !== 'unit' && pickerFor !== 'category' ? (
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
            ) : pickerFor === 'category' ? (
              <Picker
                selectedValue={tempCategory}
                onValueChange={v => setTempCategory(v)}
                style={styles.quantityPicker}
              >
                {CATEGORY_VALUES.map(c => (
                  <Picker.Item key={c} label={c} value={c} />
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
      <Modal visible={showCamera} animationType="slide" statusBarTranslucent onRequestClose={() => setShowCamera(false)}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScan}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          />
          {/* 暗幕オーバーレイ（フレーム外） */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: FRAME_TOP, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <View style={{ position: 'absolute', top: FRAME_TOP + FRAME_SIZE, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <View style={{ position: 'absolute', top: FRAME_TOP, left: 0, width: FRAME_LEFT, height: FRAME_SIZE, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <View style={{ position: 'absolute', top: FRAME_TOP, left: FRAME_LEFT + FRAME_SIZE, right: 0, height: FRAME_SIZE, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          {/* スキャン枠（コーナーブラケット） */}
          <View style={{ position: 'absolute', top: FRAME_TOP, left: FRAME_LEFT, width: FRAME_SIZE, height: FRAME_SIZE }}>
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>
          {/* 案内テキスト */}
          <View style={{ position: 'absolute', top: FRAME_TOP + FRAME_SIZE + 28, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={styles.cameraHint}>バーコードをフレーム内に合わせてください</Text>
          </View>
          {/* 閉じるボタン */}
          <Pressable style={styles.cameraClose} onPress={() => setShowCamera(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {/* ルックアップ中のローディング */}
          {isLookingUp && (
            <View style={styles.lookingUpOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.lookingUpText}>商品を検索中...</Text>
            </View>
          )}
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
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roomChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#C6C6C8',
  },
  roomChipSelected: { backgroundColor: '#a3cdfa', borderColor: '#a3cdfa' },
  roomChipText: { fontSize: 13, color: '#333' },
  roomChipTextSelected: { color: '#333', fontWeight: '600' },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginTop: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  storageDaysUnit: { fontSize: 16, color: '#333' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#fff',
  },
  cameraHint: { color: '#fff', fontSize: 14, textAlign: 'center' },
  cameraClose: {
    position: 'absolute',
    top: 56,
    left: 16,
    padding: 8,
  },
  lookingUpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  lookingUpText: { color: '#fff', fontSize: 16 },
});
