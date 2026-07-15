import { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { formatExpiry, getExpiryStatus, statusColor, resolveExpiry } from '../utils/expiry';

type Props = {
  name: string;
  expiresAt?: string;
  purchasedAt?: string;
  storageDays?: number;
  roomName?: string;
  onPress?: () => void;
  onDelete?: () => void;
};

export function IngredientItem({ name, expiresAt, purchasedAt, storageDays, roomName, onPress, onDelete }: Props) {
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
        <Text style={styles.name}>{name}</Text>
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
  name: { fontSize: 16, color: '#333' },
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
