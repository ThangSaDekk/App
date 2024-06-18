import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import api, { authApi } from '../services/api';
import { MyUserContext } from '../services/Contexts';
import { Button, Icon } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BusLineDetailsScreen = ({ route, navigation }) => {
    const { busRouteId, fare } = route.params;
    const [busLines, setBusLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useContext(MyUserContext);
    const [refreshing, setRefreshing] = useState(false);


    // Fetch bus lines based on busRouteId
    const fetchBusLines = async () => {
        try {
            let url = `/busroutes/${busRouteId}/buslines/`;
            if(!user || user.role !== 'admin')
            {
                url += '?isActive=1'
            }
            console.log(url)
            const response = await api.get(url);
            setBusLines(response.data.results);
        } catch (error) {
            console.error('Error fetching bus lines:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusLines();
    }, []);

    const handleLockOrUnLock = async (active, busroute) =>{
        const token = await AsyncStorage.getItem('token');
        let res = authApi(token).patch(`/busline/${busroute}/`, { 'active': !active })
        console.log(res.data);
        setLoading(true);
        onRefresh()
    }

    // Function to render each bus line item
    const renderItem = ({ item }) => {
        const currentTime = new Date().getTime();
        const departureTime = new Date(item.departure_date_time).getTime();
        const currentTimePlusOneHour = currentTime + 60 * 60 * 1000;

        if (departureTime > currentTimePlusOneHour && item.arrival_actual === null) {
            return (
                <View style={styles.card}>
                    <View style={styles.cardDetails}>
                        <View style={styles.cartIcon}>
                            <Ionicons
                                name="bus-outline"
                                color="#FFA500"
                                size={50}

                            />
                            <Text style={styles.cardTitle}>{item.code.split('_').slice(0, 3).join('_')}</Text>

                        </View>
                        <Text style={styles.cardTitle}>Thời gian đi: {formatExpectedTime(item.departure_date_time)}</Text>
                        <Text style={styles.cardText}>Thời gian dự kiến: {formatExpectedTime(item.arrival_excepted)}</Text>

                        {user ? (
                            user.role === 'admin' ? (
                                <View style={[styles.statusContainer, { backgroundColor: item.active? "lightgreen":"#FA8072" }]}>
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
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.bookButton}
                                    onPress={() => navigation.navigate('Booking', { busLineId: item.id, fare: fare })}
                                >
                                    <Text style={styles.bookButtonText}>Đặt vé ngay !!!</Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.bookButtonText}>Đăng nhập đặt vé</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        } else {
            return null;
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBusLines();
        setRefreshing(false);
    };

    // Format thời gian dự kiến từ ISO 8601 sang định dạng ngày giờ dễ đọc
    const formatExpectedTime = (isoDate) => {
        if (!isoDate) return '';
        const dateObj = new Date(isoDate);
        return dateObj.toLocaleString(); // Chuyển đổi thành định dạng ngày giờ dễ đọc
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFA500" />
            </View>
        );
    }



    return (
        <View style={styles.container}>
            {(busLines.length === 0)  ? (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Không có chuyến xe nào</Text>
                </View>
            ) : (
                <FlatList
                    data={busLines}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    RefreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    list: {
        flex: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 5,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: "#f0f0f0"
    },
    cartIcon: {
        flexDirection:'row',
        justifyContent:'center',
        marginBottom:10,
    },
    cardDetails: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: "#FFA500",
        padding: 15,
        elevation: 10,
        shadowColor: 10,
        borderRadius: 20,
        marginHorizontal:10,
        textAlign:'center'
    },
    cardText: {
        marginTop: 10,
        fontSize: 14,
        color: '#555',
        
    },
    bookButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 15,
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 18,
        color: '#555',
    },
    statusContainer: {
        borderColor: "#FFA500",
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 20,
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
        marginLeft: 10,
    },
    lockButtonText: {
        color: '#fff',
    },
});

export default BusLineDetailsScreen;