import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api, { authApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { MyUserContext } from '../services/Contexts';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchScreen = ({ route }) => {
    const [fromPoint, setFromPoint] = useState('');
    const [toPoint, setToPoint] = useState('');
    const [routes, setRoutes] = useState([]);
    const [sortCriteria, setSortCriteria] = useState('');
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const user = useContext(MyUserContext)
    const [routeEle, setRouteEle] = useState({})
    const fields = [
        { label: "Điểm bắt đầu: ", icon: "account", name: "starting_point" },
        { label: "Điểm đến: ", icon: "account", name: "destination" },
        { label: "Thời gian hoạt động: (Ex: 4:00-23:00) ", icon: "mail", name: "active_time" },
        { label: "Khoảng cách: ", icon: "phone", name: "distance" },
        { label: "Thời gian dự kiến hoàn thành: ", icon: "address", name: "estimated_duration"},
        { label: "Tuần suất:(01:00:00) ", icon: "address", name: "frequency"},
        { label: "Giá tiền: ", icon: "address", name: "fare"}

    ];
    const fetchBusRoutes = async () => {
        setLoading(true);
        try {
            let busId = 0;
            if (route.params?.busId && user && (user.role === 'admin' || user.role === 'busowner')) { busId = route.params?.busId }

            console.log(busId)
            let url;
            if (busId !== 0) {
                url = `/busroutes/?businfor_id=${busId}`;
            }
            else {
                url = '/busroutes/?active=1'
            }
            if (fromPoint && toPoint) {
                url += `&starting_point=${(fromPoint).trim()}&destination=${(toPoint).trim()}`;
            }
            console.log(url)
            const response = await api.get(url);

            let sortedRoutes = response.data;
            if (sortCriteria === 'fare') {
                sortedRoutes = sortedRoutes.sort((a, b) => a.fare - b.fare);
            } else if (sortCriteria === 'bias') {
                sortedRoutes = sortedRoutes.sort((a, b) => b.bias - a.bias);
            }
            setRoutes(sortedRoutes);
        } catch (error) {
            console.error('Error fetching bus routes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBusRoutes();
    }, [fromPoint, toPoint, sortCriteria, route.params?.busId, user]);

    const updateState = (fieldName, value) => {
        setRouteEle({
            ...routeEle,
            [fieldName]: value
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBusRoutes();
        setRefreshing(false);
    };

    const handleLockOrUnLock = async (active, busroute) => {
        const token = await AsyncStorage.getItem('token');
        let res = authApi(token).patch(`/busroutes/${busroute}/`, { 'active': !active })
        console.log(res.data);
        onRefresh()
    }
    const handleAddBusRoute = () =>{
        console.log("Tan")
    }

    const renderItem = ({ item }) => (
        <View>
            <TouchableOpacity
                style={[styles.card, { backgroundColor: item.active ? "#FFA500" : "#FA8072", marginBottom: user && user.role === 'admin' ? 5 : 20 }]}
                onPress={() => {
                    if (item.active) {
                        navigation.navigate('BusLineDetails', { busRouteId: item.id, fare: item.fare });
                    }
                }}
            >
                <Ionicons name="bus" size={50} marginRight={10} />
                <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{item.starting_point} - {item.destination}</Text>
                    <Text style={styles.cardTitle}>Giá vé: {item.fare.toLocaleString('en-US')} VND</Text>
                    <Text style={styles.cardText}>Mã tuyến: {item.code}</Text>
                    <Text style={styles.cardText}>Điểm đón đầu: {item.starting_point}</Text>
                    <Text style={styles.cardText}>Điểm cuối: {item.destination}</Text>
                    <Text style={styles.cardText}>Thời gian hoạt động: {item.active_time}</Text>
                    <Text style={styles.cardText}>Khoảng cách: {item.distance} km</Text>
                    <Text style={styles.cardText}>Thời gian ước tính: {item.estimated_duration}</Text>
                    <Text style={styles.cardText}>Điểm số: {item.bias} point</Text>
                </View>
            </TouchableOpacity>
            {user && user.role == 'admin' ? <View style={[styles.statusContainer, { backgroundColor: "#f0f0f0" }]}>
                <Text style={styles.statusText}>
                    <Ionicons
                        name={item.active ? "checkmark-circle-outline" : "close-circle-outline"}
                        size={22}
                        color={item.active ? "green" : "red"}

                    />
                    {item.active ? " Đang hoạt động" : " Đang khóa"}
                </Text>
                <Button
                    mode="contained"
                    icon={item.active ? "lock-outline" : "lock-open-outline"}
                    onPress={() => handleLockOrUnLock(item.active, item.id)}
                    style={[styles.lockButton, { backgroundColor: item.active ? "#FA8072" : "lightgreen" }]}
                    labelStyle={styles.lockButtonText}
                >
                    {item.active ? "Khóa" : "Mở khóa"}
                </Button>
            </View> : <></>

            }
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Điểm đi..."
                    value={fromPoint}
                    onChangeText={setFromPoint}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Điểm đến..."
                    value={toPoint}
                    onChangeText={setToPoint}
                />
            </View>
            <View style={styles.filterContainer}>
                <Button
                    mode="contained"
                    onPress={() => setSortCriteria('fare')}
                    style={styles.filterButton}
                    labelStyle={styles.filterButtonText}
                >
                    Giá vé tốt nhất
                </Button>
                <Button
                    mode="contained"
                    onPress={() => setSortCriteria('bias')}
                    style={styles.filterButton}
                    labelStyle={styles.filterButtonText}
                >
                    Đánh giá tốt nhất
                </Button>
            </View>
           
            {user && user.role ==='busowner'?
            <>
                   <Button
                    icon="bus"
                    mode="contained"
                    onPress={() => {setShowEditDialog(true)}}
                    style={[styles.filterButton, {width:'97%', marginBottom:10, backgroundColor:"lightgreen"}]}
                    labelStyle={styles.filterButtonText}
                >
                    THÊM TUYẾN XE
                </Button>
            </>:<></>
            }
             <Text style={styles.note}>* Thực hiện cập nhật lại trang để tìm được những tuyến đi tốt nhất.</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#FFA500" style={styles.loading} />
            ) : (
                <FlatList
                    data={routes}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                />
            )}
              <Modal
                visible={showEditDialog}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEditDialog(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.editDialog}>
                        <Text style={styles.editDialogTitle}>Chỉnh sửa thông tin</Text>
                        {fields.map((field) => (
                            <TextInput
                                key={field.name}
                                placeholder={field.label}
                                value={routeEle[field.name]}
                                onChangeText={(text) => updateState(field.name, text)}
                                style={styles.editInput}
                            />
                        ))}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={handleAddBusRoute} 
                            >
                                <Text style={styles.editButtonText}>Xác nhận chỉnh sửa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.editButtonCancel}
                                onPress={() => setShowEditDialog(false)}
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
        backgroundColor: '#fff',
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        height: 45,
        borderColor: '#FFA500',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'row',
        marginBottom: 10,
    },
    filterButton: {
        backgroundColor: '#FFA500',
        width: '47%',
        paddingVertical: 3,
        borderRadius: 10,
        marginRight: 10,
    },
    filterButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: '#ccc',
        borderRadius: 15,
        padding: 10,
        backgroundColor: "#FFA500",
        elevation: 6
    },
    cardDetails: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardText: {
        fontSize: 14,
        color: '#555',
    },
    note: {
        fontSize: 11,
        color: 'blue',
        marginBottom: 15,
    },
    statusContainer: {
        borderColor: "#FFA500",
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 20,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 16,
        flex: 1,
        color: '#333',
    },
    lockButton: {
        backgroundColor: '#FFA500',
        marginLeft: 10,
    },
    lockButtonText: {
        color: '#fff',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    editDialog: {
        width: "90%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    editDialogTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    editInput: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    editButton: {
        flex: 1,
        backgroundColor: "#4CAF50",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginHorizontal: 5,
    },
    editButtonCancel: {
        flex: 1,
        backgroundColor: "#F44336",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginHorizontal: 5,
    },
    editButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
});

export default SearchScreen;
