import { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { formatExpiry, getExpiryStatus, statusColor, resolveExpiry } from '../utils/expiry';

type Props = {
  name: string;
  quantity?: number;
  unit?: string;
  expiresAt?: string;
  purchasedAt?: string;
  storageDays?: number;
  roomName?: string;
  badgeStatus?: 'add' | 'update';
  onPress?: () => void;
  onDelete?: () => void;
};

export function IngredientItem({ name, quantity, unit, expiresAt, purchasedAt, storageDays, roomName, badgeStatus, onPress, onDelete }: Props) {
  const swipeableRef = useRef<Swipeable>(null);
  const effective = resolveExpiry({ expiresAt, purchasedAt, storageDays });
  const label = formatExpiry(effective);
  const status = getExpiryStatus(effective);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete?.();
      }}
    >
      <Ionicons name="trash-outline" size={22} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      rightThreshold={40}
      overshootRight={false}
    >
      <Pressable style={styles.item} onPress={onPress}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, quantity === 0 && styles.nameLow]}>
            {name}{quantity === 0 ? ' あと少し' : quantity != null ? ` ${quantity}${unit ?? '個'}` : ''}
          </Text>
          {badgeStatus === 'add' && <Text style={styles.badgeNew}>NEW!</Text>}
          {badgeStatus === 'update' && <View style={[styles.badge, styles.badgeUpdate]} />}
        </View>
        <View style={styles.meta}>
          {label !== '' && (
            <Text style={[styles.expiry, { color: statusColor(status) }]}>{label}</Text>
          )}
          {roomName !== undefined && (
            <Text style={styles.room}>{roomName}</Text>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}

export const ingredientListStyles = StyleSheet.create({
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  nameRow: { flexShrink: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, minWidth: 0, fontSize: 16, color: '#333' },
  nameLow: { color: '#E74C3C' },
  badgeNew: { fontSize: 14, fontWeight: '700', color: '#E74C3C' },
  badge: { width: 8, height: 8, borderRadius: 4 },
  badgeUpdate: { backgroundColor: '#F39C12' },
  meta: { alignItems: 'flex-end', gap: 2 },
  expiry: { fontSize: 12, fontWeight: '500' },
  room: { fontSize: 11, color: '#aaa' },
  deleteAction: {
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
});
