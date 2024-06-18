import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import api, { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from '../services/Contexts';

const DetailsScreen = ({ route, navigation }) => {

    const { busId } = route.params;
    const [busDetails, setBusDetails] = useState(null);
    const [deliverys, setDeliverys] = useState({
        sender_name: '',
        sender_phone: '',
        sender_email: '',
        receiver_name: '',
        receiver_phone: '',
        receiver_email: '',
        weight: '',
        content: ''
    });
    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

    const fields = [
        { label: "Họ tên: ", icon: "account", name: "sender_name" },
        { label: "Số điện thoại: ", icon: "phone", name: "sender_phone" },
        { label: "Email: ", icon: "mail", name: "sender_email" },
        { label: "Họ tên: ", icon: "account", name: "receiver_name" },
        { label: "Số điện thoại: ", icon: "phone", name: "receiver_phone" },
        { label: "Email: ", icon: "mail", name: "receiver_email" },
        { label: "Trọng lượng: ", icon: "scale", name: "weight" },
        { label: "Lời nhắn: ", icon: "text", name: "content" }
    ];
    const user = useContext(MyUserContext);

    useEffect(() => {
        const fetchBusDetails = async () => {
            try {
                const response = await api.get(`/businfors/${busId}`);
                setBusDetails(response.data);
            } catch (error) {
                console.error('Error fetching bus details:', error);
                // Handle error state
            }
        };

        fetchBusDetails();
    }, [busId, navigation]); // Fetch whenever busId changes

    const handleConfirmeBusinfor = async () => {
        try {
            // Chờ việc truy xuất token từ AsyncStorage
            let token = await AsyncStorage.getItem('token');

            if (!token) {
                console.error('No token found');
                return;
            }

            // Cập nhật trạng thái 'active'
            await api.patch(`/businfor/${busId}/`, { 'active': true });

            // Thực hiện yêu cầu để lấy bus routes là chưa kích hoạt
            const res = await authApi(token).get(`/businfors/${busId}/busroutes/?isActive=0`);

            // In kết quả ra console
            console.log(res.data.results);

            await res.data.results.map(item => {
                authApi(token).patch(`busroutes/${item.id}/`, { 'active': true })
            });

            // Điều hướng đến trang Home với tham số reload
            navigation.navigate('Home', { reload: Math.random() });
        } catch (error) {
            console.error('Error handling bus information:', error);
        }
    };

    const handleCancleBusinfor = async () => {
        try {
            // Chờ việc truy xuất token từ AsyncStorage
            let token = await AsyncStorage.getItem('token');

            if (!token) {
                console.error('No token found');
                return;
            }

            // Cập nhật trạng thái 'active'
            await api.patch(`/businfor/${busId}/`, { 'active': false });

            // Thực hiện yêu cầu để lấy bus routes là chưa kích hoạt
            const res = await authApi(token).get(`/businfors/${busId}/busroutes/?isActive=1`);

            // In kết quả ra console
            console.log(res.data.results);

            await res.data.results.map(item => {
                authApi(token).patch(`busroutes/${item.id}/`, { 'active': false })
                console.log(item.name)
            });

            // Điều hướng đến trang Home với tham số reload
            navigation.navigate('Home', { reload: Math.random() });
        } catch (error) {
            console.error('Error handling bus information:', error);
        }

    }
    const handleDeleteBusinfor = () => {
        // Viết hàm xóa nhà xe 
        // Hiện arlert hỏi xác nhận lại hay không 
        // api: /businfor/{busId}
        // Điều hướng đến trang Home với tham số 
        // nên viết try - catch
        navigation.navigate('Home', { reload: Math.random() });
    }

    const handleDeliveryPress = () => {
        setShowDeliveryDialog(true);
    };
    const handleDeliveryConfirm = async () => {
        try {
            const token = AsyncStorage.getItem('token');
            if (token === undefined) {
                console.info('Chưa được xác thực !!')
            }
            const response = await authApi(token).post(`businfors/${busId}/deliverys/`, {
                "sender_name": deliverys.sender_name,
                "sender_phone": deliverys.sender_phone,
                "sender_email": deliverys.sender_email,
                "receiver_name": deliverys.receiver_name,
                "receiver_phone": deliverys.receiver_phone,
                "receiver_email": deliverys.receiver_email,
                "weight": deliverys.weight,
                "content": deliverys.content
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 || response.status === 201) {
                // Assuming a successful response status
                setShowDeliveryDialog(false);
                // Optionally, reset form fields
                setDeliverys({
                    sender_name: '',
                    sender_phone: '',
                    sender_email: '',
                    receiver_name: '',
                    receiver_phone: '',
                    receiver_email: '',
                    weight: '',
                    content: ''
                });
                // Provide user feedback (e.g., a success message)
                alert('Delivery information submitted successfully!');
            } else {
                // Handle other statuses or unsuccessful submissions
                alert('Failed to submit delivery information. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting delivery information:', error);
            // Provide user feedback for the error
            alert('An error occurred while submitting the delivery information.');
        }
    }

    const updateState = (name, value) => {
        setDeliverys((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <View style={styles.container}>
            {busDetails ? (
                <>
                    <Image
                        source={{ uri: busDetails.avatar }}
                        style={styles.avatar}
                    />
                    <Text style={styles.title}>{busDetails.name}</Text>
                    <Text style={styles.text}>Mã nhà xe: {busDetails.code}</Text>
                    <Text style={styles.text}>Số điện thoại: {busDetails.phone}</Text>
                    <Text style={styles.text}>Email: {busDetails.email}</Text>
                    <Text style={styles.text}>Địa chỉ: {busDetails.address}</Text>
                    <Text style={styles.text}>Điểm đánh giá: {busDetails.bias}</Text>


                    {
                        user && user.role === 'admin' ? (
                            busDetails.active === false ? (
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity onPress={handleConfirmeBusinfor} style={[styles.button, { width: '47%', backgroundColor:'lightgreen' }]}>
                                        <Text style={styles.buttonText}>Duyệt hoạt động</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={console.log("press")} style={[styles.button, { width: '37%', marginLeft: '6%', backgroundColor:'#FA8072' }]}>
                                        <Text style={styles.buttonText}>Xóa yêu cầu</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={handleCancleBusinfor} style={[styles.button, { width: '40%', backgroundColor:"#FA8072" }]}>
                                    <Text style={styles.buttonText}>Khóa nhà xe</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            busDetails.is_delivery_enabled ? (
                                <TouchableOpacity onPress={handleDeliveryPress} style={[styles.button, { width: '40%' }]}>
                                    <Text style={styles.buttonText}>Đặt giao hàng</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.button, { width: '40%', backgroundColor: '#ccc' }]}>
                                    <Text style={[styles.buttonText, { color: '#888' }]}>Đặt giao hàng</Text>
                                </View>
                            )
                        )
                    }

                </>
            ) : (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
            <Modal
                visible={showDeliveryDialog}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDeliveryDialog(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.deliveryDialog}>
                        <Text style={styles.deliveryDialogTitle}>Thông tin người gửi</Text>
                        {fields.slice(0, 3).map((field) => (
                            <TextInput
                                key={field.name}
                                placeholder={field.label}
                                value={deliverys[field.name]}
                                onChangeText={(text) => updateState(field.name, text)}
                                style={styles.deliveryInput}
                                secureTextEntry={field.secureTextEntry}
                            />
                        ))}
                        <Text style={styles.deliveryDialogTitle}>Thông tin người nhận</Text>
                        {fields.slice(3, 6).map((field) => (
                            <TextInput
                                key={field.name}
                                placeholder={field.label}
                                value={deliverys[field.name]}
                                onChangeText={(text) => updateState(field.name, text)}
                                style={styles.deliveryInput}
                                secureTextEntry={field.secureTextEntry}
                            />
                        ))}
                        <Text style={styles.deliveryDialogTitle}>Thông tin gói hàng</Text>
                        {fields.slice(6).map((field) => (
                            <TextInput
                                key={field.name}
                                placeholder={field.label}
                                value={deliverys[field.name]}
                                onChangeText={(text) => updateState(field.name, text)}
                                style={styles.deliveryInput}
                                secureTextEntry={field.secureTextEntry}
                            />
                        ))}
                        <View flexDirection='row'>
                            <TouchableOpacity
                                style={styles.deliveryButton}
                                onPress={handleDeliveryConfirm} // gọi tạo delivery && tắt modal
                            >
                                <Text style={styles.deliveryButtonText}>Xác nhận đặt hàng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deliveryButtonCancle}
                                onPress={() => setShowDeliveryDialog(false)}
                            >
                                <Text style={styles.deliveryButtonText}>Hủy đặt hàng</Text>
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
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 5,
        color: '#FFA500',
        width:'100%',
        textAlign:'center',
        borderBottomWidth: 3,
        borderColor: '#555'
    },
    text: {
        fontSize: 17,
        fontWeight:'bold',
        marginBottom: 5,
        backgroundColor: "#FFA500",
        paddingHorizontal: 40,
        paddingVertical: 10,
        width:'100%',
        borderBottomRightRadius: 30,
        borderTopLeftRadius: 30,
    },
    avatar: {
        width: '100%',
        height: '38%',
        shadowRadius: 10,
        borderBottomRightRadius: 40,
        borderTopLeftRadius: 40,
    },
    button: {
        backgroundColor: '#FFA500',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width:'100%',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    deliveryDialog: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        width: '90%',
        alignSelf: 'center',
    },
    deliveryDialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    deliveryInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    deliveryButton: {
        backgroundColor: '#FFA500',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '50%',
        marginBottom: 10,
        marginRight: 5,
    },
    deliveryButtonCancle: {
        backgroundColor: "#FA8072",
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '50%',
        marginBottom: 10,
        marginRight: 5,
    },
    deliveryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default DetailsScreen;
