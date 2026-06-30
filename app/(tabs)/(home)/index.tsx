import { Alert, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FridgeView } from '../../../components/FridgeView';
import { useApp } from '../../../store/AppContext';
import { Room } from '../../../types';

export default function HomeScreen() {
  const { rooms, updateRoomName } = useApp();
  const router = useRouter();

  const handlePress = (room: Room) => {
    router.push(`/room/${room.id}`);
  };

  const handleLongPress = (room: Room) => {
    Alert.prompt(
      '部屋名を変更',
      '',
      (name) => { if (name?.trim()) updateRoomName(room.type, name.trim()); },
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
