import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Image, RefreshControl } from 'react-native';
import { ActivityIndicator, Button as PaperButton } from 'react-native-paper'; // Import Button from react-native-paper
import api, { authApi } from '../services/api';
import { MyUserContext } from '../services/Contexts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ route, navigation }) => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useContext(MyUserContext);
  const [roleAdmin, setRoleAdmin] = useState(false);
  const [roleBusOwner, setRoleBusOwner] = useState(false);
  const [end, setEnd] = useState('/businfors/?active=1');
  const [refreshing, setRefreshing] = useState(false);


  const fetchBusInfos = async () => {
    try {
      setLoading(true);
      let response;
      // Thực hiện tải businfor của nhà xe
      if (user && user.role === 'busowner')
      {
        const token = await AsyncStorage.getItem('token');
        response = await authApi(token).get('/businfors/current-businfor/')
        console.log(response.data)
        setBuses(response.data);
        console.log(buses.length)
        setRoleBusOwner(true);
        setRoleAdmin(false);

      }
      else if (user && user.role === 'admin') {
        response = await api.get(`${end}`);
        setBuses(response.data.results);
        console.log(buses.length)
        setRoleBusOwner(false);
        setRoleAdmin(true);
      }
      else{
        response = await api.get(`${end}`);
        setBuses(response.data.results);
        console.log(buses.length)
        setRoleBusOwner(false);
        setRoleAdmin(false);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  useEffect(() => {
    setRoleAdmin(user && user.role === 'admin');
    fetchBusInfos();
  }, [user, end, route.params?.reload]);

  const onRefresh = async () => {
    setRefreshing(true);
    fetchBusInfos();
    setRefreshing(false);
};


  const BusCard = ({ bus, onPress }) => (
    <View style={styles.card}>
      <Image source={{ uri: bus.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{bus.name}</Text>
      <Text style={styles.code}>Mã nhà xe: {bus.code}</Text>
      {(user && roleAdmin && end === '/businfors/?active=1' )|| (user && roleBusOwner) ? (
        <View style={styles.buttonContainer}>
          <PaperButton
            mode="contained"
            onPress={onPress}
            style={styles.button}
            buttonColor="#FFA500"
          >
            Xem thông tin
          </PaperButton>
          <PaperButton
            mode="contained"
            onPress={() => { navigation.navigate("Search", { busId: bus.id }) }}
            style={styles.button}
            buttonColor="#FFA500"
          >
            Xem tuyến xe
          </PaperButton>
        </View>
      ) : (
        <PaperButton
          mode="contained"
          onPress={onPress}
          style={styles.singleButton}
          buttonColor="#FFA500"
        >
          Xem chi tiết
        </PaperButton>
      )}
      {user && user.role ==='busowner' && (
         <PaperButton
         mode="contained"
         onPress={() => {navigation.navigate("Stats",{busId:bus.id})}}
         style={styles.singleButton}
         buttonColor="#FFA500"
       >
         Xem chi tiết thống kê
       </PaperButton>
  )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Các phần header tùy thuộc vào vai trò của user */}
      {user && roleAdmin && <Text style={styles.namePage}>TRANG QUẢN TRỊ CỦA ADMIN </Text>}
      {user && !roleAdmin && !roleBusOwner && (
        <Text style={styles.namePage}>
          Chào {user.last_name} {user.first_name} !!
        </Text>
      )}
      {user && roleBusOwner && <Text style={styles.namePage}>TRANG QUẢN TRỊ CỦA ĐỐI TÁC !!</Text>}
  
      {/* Phần filter tùy thuộc vào vai trò admin */}
      {user && roleAdmin && (
        <View style={styles.filterContainer}>
          <PaperButton
            mode="contained"
            onPress={() => setEnd('/businfors/?active=1')}
            style={styles.filterButton}
            buttonColor="#FFA500"
          >
            Nhà xe đối tác
          </PaperButton>
          <PaperButton
            mode="contained"
            onPress={() => setEnd('/businfors/?active=0')}
            style={styles.filterButton}
            buttonColor="#FFA500"
          >
            Yêu cầu chờ duyệt
          </PaperButton>
        </View>
      )}
  
      {/* Hiển thị danh sách hoặc thông báo không có bus */}
      {loading ? (
        <View style={styles.containerIC}>
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator animating={true} color="#FFA500" size="large" />
          </View>
        </View>
      ) : (
        <>
          {/* Kiểm tra nếu buses là mảng */}
          {Array.isArray(buses) && buses.length > 0 ? (
            buses.map((bus) => (
              <BusCard
                key={bus.id}
                bus={bus}
                onPress={() => navigation.navigate('Details', { busId: bus.id })}
              />
            ))
          ) : (
            /* Kiểm tra nếu buses là đối tượng JSON */
            typeof buses === 'object' ? (
              <BusCard
                bus={buses} // Hiển thị thông tin của đối tượng JSON
                onPress={() => navigation.navigate('Details', { busId: buses.id })}
              />
            ) : (
              <View style={styles.noBusesContainer}>
                <Text style={styles.noBusesText}>
                  {end === '/businfors/?active=1'
                    ? 'Không có nhà xe đối tác đang hoạt động'
                    : 'Không có yêu cầu chờ duyệt'}
                </Text>
              </View>
            )
          )}
        </>
      )}
    </ScrollView>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  namePage: {
    backgroundColor: '#FFA500',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
  },
  containerIC: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  activityIndicatorContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    width: 500,
    height: 700,
    borderRadius: 10,
    justifyContent: 'center',
    alignContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  noBusesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  noBusesText: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  singleButton: {
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default HomeScreen;
