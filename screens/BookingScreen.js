import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
    TextInput, Image, Alert, Modal,
    BackHandler
} from 'react-native';
import api, { authApi } from '../services/api';
import { Checkbox } from 'react-native-paper';
import { MyUserContext } from '../services/Contexts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const BookingScreen = ({ route }) => {
    const { busLineId, fare } = route.params;
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentCode, setPaymentCode] = useState('');
    const user = useContext(MyUserContext);
    const [tickets, setTickets] = useState([]);
    const [showTicketDialog, setShowTicketDialog] = useState(false);
    const navigation = useNavigation();


    const revertSelectedSeats = async () => {
        try {
            for (let seatId of selectedSeats) {
                await api.patch(`/seat/${seatId}/`, { 'status': 'available' });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái ghế:', error);
        }
    };



    const fetchSeats = async () => {
        try {
            const response = await api.get(`/busline/${busLineId}/seats/`);
            setSeats(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách ghế:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSeatsIfNeeded = async () => {
        try {
            const response = await api.get(`/busline/${busLineId}/seats/`);
            if (response.data.length === 0) {
                await createSeats();
            } else {
                fetchSeats();
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra hoặc tạo ghế:', error);
            fetchSeats();
        }
    };

    const createSeats = async () => {
        try {
            let seatCodeA, seatCodeB;
            for (let i = 1; i <= 12; i++) {
                seatCodeA = `A${i < 10 ? '0' + i : i}`;
                await api.post(`/busline/${busLineId}/seats/`, { "code": seatCodeA });
            }
            for (let i = 1; i <= 12; i++) {
                seatCodeB = `B${i < 10 ? '0' + i : i}`;
                await api.post(`/busline/${busLineId}/seats/`, { "code": seatCodeB });
            }
            fetchSeats();
        } catch (error) {
            console.error('Lỗi khi tạo ghế:', error);
            fetchSeats();
        }
    };

    useEffect(() => {
        createSeatsIfNeeded();
    }, [busLineId]);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectedSeats.length > 0) {
                    Alert.alert(
                        'Xác nhận',
                        'Bạn có chắc chắn muốn thoát? Các ghế đã chọn sẽ bị hủy.',
                        [
                            {
                                text: 'Hủy',
                                style: 'cancel',
                            },
                            {
                                text: 'Có',
                                onPress: async () => {
                                    await revertSelectedSeats();
                                    navigation.goBack();
                                },
                            },
                        ],
                        { cancelable: true }
                    );
                    return true; // Prevent the default behavior
                }
                return false; // Allow the default behavior
            };
    
            const backHandler = BackHandler.addEventListener(
                'hardwareBackPress',
                onBackPress
            );
    
            return () => backHandler.remove();
        }, [selectedSeats])
    );
    

    const handleSeatBooking = async (seatId) => {
        try {
            const newStatus = seats.find(seat => seat.id === seatId).status === 'available' ? 'booked' : 'available';
            await api.patch(`/seat/${seatId}/`, { 'status': newStatus });
            setSeats(prevSeats =>
                prevSeats.map(seat =>
                    seat.id === seatId ? { ...seat, status: newStatus } : seat
                )
            );
            setSelectedSeats(prevSelectedSeats =>
                newStatus === 'booked'
                    ? [...prevSelectedSeats, seatId]
                    : prevSelectedSeats.filter(id => id !== seatId)
            );
        } catch (error) {
            console.error('Lỗi khi đặt ghế:', error);
        }
    };

    const getTotalFare = () => {
        return selectedSeats.length * fare;
    };

    const handlePaymentConfirm = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token === undefined) {
                throw new Error('Người dùng chưa được xác thực');
            }

            const response = await authApi(token).post('/seat/tickets/', { 'chose_seats_ids': selectedSeats });

            const updatedTickets = [];

            // Lặp qua từng vé trong response.data
            for (let i = 0; i < response.data.length; i++) {
                const ticket = response.data[i];

                const billId = ticket.bill;
                const currentTime = new Date().toISOString();

                // Update bill
                await api.patch(`/bills/${billId}/`, {
                    'payment_code': paymentCode,
                    'active': true,
                    'payment_time': currentTime
                });

                const ticketId = ticket.id;  // Lấy id của vé từ response
                const ticketCode = ticket.code;  // Lấy mã vé từ response

                updatedTickets.push({ id: ticketId, code: ticketCode });
            }

            // Cập nhật state với danh sách vé mới
            setTickets(updatedTickets);

            // Hiển thị modal thông báo thành công
            setShowTicketDialog(true);

        } catch (error) {
            console.error('Lỗi khi xác nhận thanh toán:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi xác nhận thanh toán.');
        } finally {
            setShowPaymentDialog(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFA500" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.functionHeader}>Giá vé: {fare.toLocaleString('en-US')} VND</Text>
            <View style={styles.headerContainer}>
                <Text style={styles.deckHeader}>Tầng Trên</Text>
                <Text style={styles.deckHeader}>Tầng Dưới</Text>
            </View>

            <View style={styles.seatRow}>
                <View style={styles.deckColumn}>
                    {seats.slice(0, 12).map((seat) => (
                        <TouchableOpacity
                            key={seat.id}
                            style={[
                                styles.seat,
                                seat.status === 'available' ? styles.availableSeat : styles.bookedSeat,
                                selectedSeats.includes(seat.id) ? { backgroundColor: '#00FF00' } : {}
                            ]}
                            onPress={() => handleSeatBooking(seat.id)}
                            disabled={seat.status !== 'available' && !selectedSeats.includes(seat.id)}
                        >
                            <Text style={styles.seatText}>{seat.code.substr(-3)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.deckColumn}>
                    {seats.slice(12, 24).map((seat) => (
                        <TouchableOpacity
                            key={seat.id}
                            style={[
                                styles.seat,
                                seat.status === 'available' ? styles.availableSeat : styles.bookedSeat,
                                selectedSeats.includes(seat.id) ? { backgroundColor: '#00FF00' } : {}
                            ]}
                            onPress={() => handleSeatBooking(seat.id)}
                            disabled={seat.status !== 'available' && !selectedSeats.includes(seat.id)}
                        >
                            <Text style={styles.seatText}>{seat.code.substr(-3)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <Text style={styles.functionHeader}>Tổng giá vé: {getTotalFare().toLocaleString('en-US')} VND</Text>

            <View style={styles.infoContainer}>
                <Text style={styles.label}>Họ và tên:</Text>
                <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                />

                <Text style={styles.label}>Số điện thoại:</Text>
                <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Email:</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />

                <Text style={styles.note}>* Hãy nhập email chính xác để nhận thông báo. Nếu không thấy email thông báo, liên hệ ngay với nhà xe.</Text>
            </View>

            <Text style={styles.functionHeader}>Chọn phương thức thanh toán</Text>
            <Text style={styles.note}>* Bạn chỉ có thể chọn thanh toán trực tuyến cho mua vé online.</Text>

            <View style={styles.paymentContainer}>
                <View style={styles.checkboxContainer}>
                    <Checkbox
                        status={selectedPaymentMethod === 'Techcombank' ? 'checked' : 'unchecked'}
                        onPress={() => setSelectedPaymentMethod('Techcombank')}
                    />
                    <Text style={styles.label}>Techcombank
                    </Text>
                </View>

                <View style={styles.checkboxContainer}>
                    <Checkbox
                        status={selectedPaymentMethod === 'MoMo' ? 'checked' : 'unchecked'}
                        onPress={() => setSelectedPaymentMethod('MoMo')}
                    />
                    <Text style={styles.label}>MoMo</Text>
                </View>
            </View>

            <Modal
                visible={showPaymentDialog}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPaymentDialog(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.paymentDialog}>
                        {selectedPaymentMethod === 'Techcombank' && (
                            <Image
                                source={require(`../static/qr_code/Techcombank.jpg`)}
                                style={styles.avatarImage}
                            />
                        )}
                        {selectedPaymentMethod === 'MoMo' && (
                            <Image
                                source={require(`../static/qr_code/MoMo.jpg`)}
                                style={styles.avatarImage}
                            />
                        )}
                        <Text style={styles.paymentDialogTitle}>Nhập mã thanh toán</Text>
                        <TextInput
                            style={styles.paymentInput}
                            value={paymentCode}
                            onChangeText={setPaymentCode}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={styles.paymentButton}
                            onPress={handlePaymentConfirm}
                        >
                            <Text style={styles.paymentButtonText}>Xác nhận thanh toán</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={showTicketDialog}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTicketDialog(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.paymentDialog}>
                        <Text style={styles.paymentDialogTitle}>Đặt vé thành công</Text>
                        <ScrollView>
                            {tickets.map((ticket, index) => (
                                <View key={ticket.id} style={styles.ticketItem}>
                                    <Text style={styles.ticketText}>Vé {index + 1}:</Text>
                                    <Text style={styles.ticketText}>Mã vé: {ticket.code}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.paymentButton}
                            onPress={() => setShowTicketDialog(false)}
                        >
                            <Text style={styles.paymentButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


            <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowPaymentDialog(true)}
                disabled={!selectedPaymentMethod}
            >
                <Text style={styles.confirmButtonText}>Xác nhận đặt vé</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    functionHeader: {
        width: '100%',
        backgroundColor: '#FFA500',
        padding: 10,
        borderRadius: 10,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fff',
        textAlign: 'center',
    },
    deckHeader: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    seatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    deckColumn: {
        flex: 1,
        marginHorizontal: 10,
    },
    seat: {
        width: '100%',
        marginVertical: 5,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    availableSeat: {
        backgroundColor: '#FFA500',
    },
    bookedSeat: {
        backgroundColor: '#ccc',
    },
    seatText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    infoContainer: {
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    note: {
        fontSize: 14,
        color: 'red',
        marginTop: 10,
    },
    paymentContainer: {
        marginTop: 10,
        marginBottom: 30,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarImage: {
        width: 250,
        height: 200,
        alignSelf: 'center',
        marginVertical: 10,
    },
    paymentDialog: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        width: '90%',
        alignSelf: 'center',
    },
    paymentDialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    paymentInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    paymentButton: {
        backgroundColor: '#FFA500',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    paymentButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#FFA500',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 100,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    ticketItem: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    ticketText: {
        fontSize: 16,
    },
});

export default BookingScreen;

