import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { authApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { se, vi } from 'date-fns/locale'; // Import Vietnamese locale if you need Vietnamese
import { MyUserContext } from '../services/Contexts';

const CommentScreen = ({ route }) => {
    const { businforId } = route.params;

    const [selectedReview, setSelectedReview] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const user = useContext(MyUserContext);
    

    useEffect(() => {
        fetchComments();
    }, [businforId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).get(`/businfors/${businforId}/reviews/`);
            setComments(response.data.results);
            console.log(response.data.results); // Debug log
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReviewPress = (review) => {
        setSelectedReview(review);
        setShowCommentModal(true);
    };

    const handleModalClose = () => {
        setShowCommentModal(false);
        setSelectedReview(null);
    };
    
    const handleEdit = async () =>{
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).patch(`/reviews/${selectedReview.id}/`,{
                "comment":comment,
                "rating": rating,
            });
            console.log(response.data)  
            setComment('')
            setRating(0)
            handleModalClose();
            Alert.alert('Điều chỉnh thành công !!')
            fetchComments();
        } catch (error) {
            Alert.alert('Điều chỉnh không thành công !!')
            console.log(error);
        }

    }
    const handleDelete = async () =>{
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await authApi(token).delete(`/reviews/${selectedReview.id}/`);
            console.log(response.data)  
            setComment('')
            setRating(0)
            handleModalClose();
            Alert.alert("Xóa thành công !!")
            fetchComments();
        } catch (error) {
            Alert.alert("Xóa không thành công !!")

            console.log(error);
        }
    }

    const formatTimeAgo = (timestamp) => {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: vi });
    };

    const renderReviewItem = ({ item }) => (
        <TouchableOpacity style={styles.reviewItem} onPress={() => { item.customer.id === user.id ? handleReviewPress(item) : "" }}>
            <Text style={styles.reviewContent}>Tài khoản: {item.customer.last_name} {item.customer.first_name}</Text>
            <View style={styles.ratingContainer}>
                {Array.from({ length: 5 }, (_, index) => (
                    <Text key={index} style={index < item.rating ? styles.starSelected : styles.star}>★</Text>
                ))}
            </View>
            <Text style={styles.reviewContent}>Nội dung: {item.comment}</Text>

            <Text style={styles.reviewContent}>Thời gian:{formatTimeAgo(item.review_time)}</Text>
        </TouchableOpacity>
    );

    const renderModalContent = () => (
        <View style={styles.modalContent}>
            <Text style={{ color: "#555", fontSize: 20, textAlign: 'center', fontWeight: 'bold', marginBottom: 10 }}>
                Chỉnh sửa bình luận
            </Text>
            <View style={styles.modalContent}>
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
                    <TouchableOpacity style={styles.button} onPress={handleEdit}>
                        <Text style={styles.buttonText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:"#FA8072"}]} onPress={handleDelete}>
                        <Text style={styles.buttonText}>Xóa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:"#FA8072"}]} onPress={handleModalClose}>
                        <Text style={styles.buttonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
    

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderReviewItem}
                    keyExtractor={(item) => item.id.toString()}
                    refreshing={loading}
                    onRefresh={fetchComments}
                />
            )}

            <Modal
                transparent={true}
                animationType="slide"
                visible={showCommentModal}
                onRequestClose={handleModalClose}
            >
                <View style={styles.modalContainer}>
                    {renderModalContent()}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        padding: 10,
    },
    reviewItem: {
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    reviewContent: {
        fontSize: 16,
        color: '#333',
    },
    timestamp: {
        color: '#888',
        marginTop: 5,
        fontSize: 12,
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
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007BFF',
        borderRadius: 5,
        margin: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
});

export default CommentScreen;
