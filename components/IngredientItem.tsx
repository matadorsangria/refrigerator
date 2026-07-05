import { View, Text, Pressable, StyleSheet } from 'react-native';
import { formatExpiry, getExpiryStatus, statusColor, resolveExpiry } from '../utils/expiry';

type Props = {
  name: string;
  expiresAt?: string;
  purchasedAt?: string;
  storageDays?: number;
  roomName?: string;
  onPress?: () => void;
};

export function IngredientItem({ name, expiresAt, purchasedAt, storageDays, roomName, onPress }: Props) {
  const effective = resolveExpiry({ expiresAt, purchasedAt, storageDays });
  const label = formatExpiry(effective);
  const status = getExpiryStatus(effective);

  return (
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
  );
}

export const ingredientListStyles = StyleSheet.create({
  content: { paddingVertical: 6, paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  name: { fontSize: 16, color: '#333' },
  meta: { alignItems: 'flex-end', gap: 2 },
  expiry: { fontSize: 12, fontWeight: '500' },
  room: { fontSize: 11, color: '#aaa' },
});
