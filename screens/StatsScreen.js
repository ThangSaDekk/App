import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { DataTable, Text } from 'react-native-paper';
import { authApi } from '../services/api';

const StatisticsScreen = ({ route }) => {
  const { busId } = route.params;
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusRoutes = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('Token:', token); // Debug token

        const response = await authApi(token).get(`/businfors/${busId}/busroutes/`);
        console.log('Response:', response); // Debug response

        if (response && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          setRoutes(data);
        } else {
          console.error('Invalid response data:', response.data);
          setRoutes([]);
        }
      } catch (error) {
        console.error('Error fetching bus routes:', error);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusRoutes();
  }, [busId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thống kê doanh thu</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Tuyến xe</DataTable.Title>
          <DataTable.Title numeric>Tần suất</DataTable.Title>
          <DataTable.Title numeric>Doanh thu</DataTable.Title>
        </DataTable.Header>

        {routes.map((route) => (
          <RouteRow key={route.id} route={route} />
        ))}

        {/* DataTable.Pagination có thể được thêm vào nếu cần */}
      </DataTable>
    </View>
  );
};

const RouteRow = ({ route }) => {
  const [seatCount, setSeatCount] = useState(null);
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    const fetchSeatsData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('Fetching seats data with token:', token); // Debug token

        const response = await authApi(token).get(`/busroutes/${route.id}/seats/`);
        console.log('Seats response:', response); // Debug response

        if (response && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          const count = data.length;
          const calculatedRevenue = count * route.fare;
          console.log(count)
          setSeatCount(count);
          setRevenue(calculatedRevenue);
        } else {
          console.error('Invalid seats response data:', response.data);
          setSeatCount(0);
          setRevenue(0);
        }
      } catch (error) {
        console.error(`Error fetching seats data for route ${route.id}:`, error);
        setSeatCount(0);
        setRevenue(0);
      }
    };

    fetchSeatsData();
  }, [route.id, route.fare]);

  return (
    <DataTable.Row>
      <DataTable.Cell>{route.name}</DataTable.Cell>
      <DataTable.Cell numeric>{seatCount !== null ? seatCount : 'Loading...'}</DataTable.Cell>
      <DataTable.Cell numeric>{revenue !== null ? `${revenue} VND` : 'Loading...'}</DataTable.Cell>
    </DataTable.Row>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default StatisticsScreen;
