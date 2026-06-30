import { Dimensions, View, Text, Pressable, StyleSheet } from 'react-native';
import { Room, RoomId } from '../types';

const FRIDGE_HEIGHT = Dimensions.get('window').width * 1.35;

type Props = {
  rooms: Room[];
  onPress: (room: Room) => void;
  onLongPress: (room: Room) => void;
};

type CellProps = {
  room: Room | undefined;
  style?: object;
  onPress: () => void;
  onLongPress: () => void;
};

function Cell({ room, style, onPress, onLongPress }: CellProps) {
  if (!room) return <View style={[styles.cell, style]} />;
  return (
    <Pressable
      style={({ pressed }) => [styles.cell, style, pressed && styles.cellPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Text style={styles.cellLabel}>{room.name}</Text>
    </Pressable>
  );
}

export function FridgeView({ rooms, onPress, onLongPress }: Props) {
  const get = (type: RoomId) => rooms.find(r => r.type === type);

  return (
    <View style={[styles.fridge, { height: FRIDGE_HEIGHT }]}>
      <Cell
        room={get('fridge')}
        style={{ flex: 4, backgroundColor: '#EBF5FB' }}
        onPress={() => { const r = get('fridge'); if (r) onPress(r); }}
        onLongPress={() => { const r = get('fridge'); if (r) onLongPress(r); }}
      />
      <Cell
        room={get('vegetable')}
        style={{ flex: 2, backgroundColor: '#EAFAF1' }}
        onPress={() => { const r = get('vegetable'); if (r) onPress(r); }}
        onLongPress={() => { const r = get('vegetable'); if (r) onLongPress(r); }}
      />
      <View style={styles.row}>
        <Cell
          room={get('ice-maker')}
          style={{ flex: 1, backgroundColor: '#D6EAF8', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#A9CCE3' }}
          onPress={() => { const r = get('ice-maker'); if (r) onPress(r); }}
          onLongPress={() => { const r = get('ice-maker'); if (r) onLongPress(r); }}
        />
        <Cell
          room={get('freezer-upper')}
          style={{ flex: 1, backgroundColor: '#D6EAF8' }}
          onPress={() => { const r = get('freezer-upper'); if (r) onPress(r); }}
          onLongPress={() => { const r = get('freezer-upper'); if (r) onLongPress(r); }}
        />
      </View>
      <Cell
        room={get('freezer-lower')}
        style={{ flex: 2, backgroundColor: '#C5E2F5' }}
        onPress={() => { const r = get('freezer-lower'); if (r) onPress(r); }}
        onLongPress={() => { const r = get('freezer-lower'); if (r) onLongPress(r); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fridge: {
    borderWidth: 2,
    borderColor: '#5DADE2',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 24,
  },
  row: {
    flex: 2,
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#A9CCE3',
  },
  cellPressed: {
    opacity: 0.6,
  },
  cellLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A5276',
  },
});
