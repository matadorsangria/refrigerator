import { Dimensions, View, Text, Pressable, StyleSheet } from 'react-native';
import { Room, FridgeShapeId } from '../types';

const FRIDGE_HEIGHT = Dimensions.get('window').width * 1.35;

type Props = {
  shape: FridgeShapeId;
  rooms: Room[];
  onPress: (room: Room) => void;
  onLongPress: (room: Room) => void;
  badgeRoomPositions?: Set<number>;
};

type CellProps = {
  room: Room | undefined;
  style?: object;
  labelStyle?: object;
  hasBadge?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function Cell({ room, style, labelStyle, hasBadge, onPress, onLongPress }: CellProps) {
  if (!room) return <View style={[styles.cell, style]} />;
  if (!room.active) return (
    <View style={[styles.cell, style]}>
      <Text style={[styles.cellLabel, labelStyle]}>{room.name}</Text>
    </View>
  );
  return (
    <Pressable
      style={({ pressed }) => [styles.cell, style, pressed && styles.cellPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.cellContent}>
        <Text style={[styles.cellLabel, labelStyle]}>{room.name}</Text>
        {hasBadge && <View style={styles.badge} />}
      </View>
    </Pressable>
  );
}

// 'standard' 形状: 上から position 1〜5、冷蔵庫外に 6=常温
function StandardFridgeView({ rooms, onPress, onLongPress, badgeRoomPositions }: Omit<Props, 'shape'>) {
  const get = (position: number) => rooms.find(r => r.position === position);
  const cell = (position: number) => {
    const r = get(position);
    return {
      room: r,
      hasBadge: badgeRoomPositions?.has(position) ?? false,
      onPress: () => { if (r) onPress(r); },
      onLongPress: () => { if (r) onLongPress(r); },
    };
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.fridge, { height: FRIDGE_HEIGHT }]}>
        <Cell {...cell(1)} style={{ flex: 4, backgroundColor: '#EBF5FB' }} />
        <Cell {...cell(2)} style={{ flex: 2, backgroundColor: '#EAFAF1' }} />
        <View style={styles.row}>
          <Cell {...cell(3)} style={{ flex: 1, backgroundColor: '#D6EAF8', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#A9CCE3' }} />
          <Cell {...cell(4)} style={{ flex: 1, backgroundColor: '#D6EAF8' }} />
        </View>
        <Cell {...cell(5)} style={{ flex: 2, backgroundColor: '#C5E2F5' }} />
      </View>
      <Cell
        {...cell(6)}
        style={{
          height: 60,
          backgroundColor: '#FEF3E2',
          borderRadius: 10,
          borderWidth: 2,
          borderBottomWidth: 2,
          borderColor: '#F5A623',
          borderBottomColor: '#F5A623',
        }}
        labelStyle={{ color: '#B7570A' }}
      />
    </View>
  );
}

export function FridgeView({ shape, rooms, onPress, onLongPress, badgeRoomPositions }: Props) {
  return (
    <StandardFridgeView rooms={rooms} onPress={onPress} onLongPress={onLongPress} badgeRoomPositions={badgeRoomPositions} />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 24,
    gap: 10,
  },
  fridge: {
    borderWidth: 2,
    borderColor: '#5DADE2',
    borderRadius: 10,
    overflow: 'hidden',
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
  cellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cellLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A5276',
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
  },
});
