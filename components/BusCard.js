import React from 'react';
import { View, Text, Image, Button, StyleSheet } from 'react-native';

const BusCard = ({ bus, onPress }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: bus.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{bus.name}</Text>
      <Text style={styles.code}>Mã nhà xe: {bus.code}</Text>
      <Button title="Xem chi tiết" onPress={onPress} color="#FFA500" />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  code: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
});

export default BusCard;
