import { Alert, View, StyleSheet, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { FridgeView } from '../../../components/FridgeView';
import { useApp } from '../../../store/AppContext';
import { Room } from '../../../types';

export default function HomeScreen() {
  const { rooms, householdShape, updateRoomName, householdId, unreadRoomIds } = useApp();
  const router = useRouter();

  if (Platform.OS === 'web' && !householdId) return <Redirect href="/settings" />;

  const handlePress = (room: Room) => {
    router.push(`/room/${room.id}`);
  };

  const handleLongPress = (room: Room) => {
    Alert.prompt(
      '部屋名を変更',
      '',
      (name) => { if (name?.trim()) updateRoomName(room.position, name.trim()); },
      'plain-text',
      room.name,
    );
  };

  return (
    <View style={styles.container}>
      <FridgeView
        shape={householdShape ?? 'standard'}
        rooms={rooms}
        onPress={handlePress}
        onLongPress={handleLongPress}
        badgeRoomPositions={unreadRoomIds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
