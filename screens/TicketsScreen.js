import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Button, TextInput, ActivityIndicator, RefreshControl, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../services/Contexts';

const TicketsScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const user = useContext(MyUserContext);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token')
      let url = '/accounts/tickets/'
      if (ticketCode !== '') {
        url += `?ticket_code=${ticketCode}`
      }
      const response = await authApi(token).get(url);
      setTickets(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setLoading(true);
    fetchTickets();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [ticketCode]);

  const renderItem = ({ item }) => (
    <View style={styles.ticket}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Mã Vé: {item.code}</Text>
        <Text style={styles.text}>Mã ghế: {item.seat.code}</Text>
        {!item.active && <Button title="Đánh giá" onPress={() => handleRating(item.id)} />}
      </View>
    </View>
  );

  const handleRating = (ticketId) => {
    setSelectedTicketId(ticketId);
    setModalVisible(true);
  };

  const handleReview = async () => {
    // Xử lý đánh giá vé
    console.log('Đánh giá vé:', selectedTicketId, rating, comment);
    setModalVisible(false);
    // Gọi API để gửi đánh giá
    try {
      const token = await AsyncStorage.getItem('token')
      await authApi(token).post(`/tickets/${selectedTicketId}/reviews/`, {
        "comment": comment,
        "rating": rating
      });
      await authApi(token).patch(`/tickets/${selectedTicketId}/`,{
        "active" : true,
      })
      // Fetch tickets again to update the list
      fetchTickets();
    } catch (error) {
      console.error(error);
    }
    setComment('');
    setRating(0);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nhập mã vé"
        value={ticketCode}
        onChangeText={setTicketCode}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đánh giá vé</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={rating >= star ? styles.starSelected : styles.star}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Nhập bình luận"
              value={comment}
              onChangeText={setComment}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleReview}
              >
                <Text style={styles.editButtonText}>Gửi đánh giá</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButtonCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.editButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  ticket: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    justifyContent: 'flex-start',
  },
  textContainer: {
    flexDirection: 'column',
    marginBottom: 8,
    borderWidth: 2,
    padding :20,
    borderRadius: 20
  },
  text: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "bold"
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    fontSize: 30,
    color: 'gray',
  },
  starSelected: {
    fontSize: 30,
    color: 'gold',
  },
  commentInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  editButtonCancel: {
    flex: 1,
    backgroundColor: "#F44336",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
},
});

export default TicketsScreen;