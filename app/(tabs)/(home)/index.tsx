import { Alert, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FridgeView } from '../../../components/FridgeView';
import { useApp } from '../../../store/AppContext';
import { RoomId } from '../../../types';

export default function HomeScreen() {
  const { rooms, updateRoomName } = useApp();
  const router = useRouter();

  const handlePress = (roomId: RoomId) => {
    router.push(`/room/${roomId}`);
  };

  const handleLongPress = (roomId: RoomId) => {
    const room = rooms.find(r => r.id === roomId)!;
    Alert.prompt(
      '部屋名を変更',
      '',
      (name) => { if (name?.trim()) updateRoomName(roomId, name.trim()); },
      'plain-text',
      room.name,
    );
  };

  return (
    <View style={styles.container}>
      <FridgeView rooms={rooms} onPress={handlePress} onLongPress={handleLongPress} />
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
