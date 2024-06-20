import 'react-native-gesture-handler';
import React, { useContext, useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import SearchScreen from './screens/SearchScreen';
import BusLineDetailsScreen from './screens/BusLineDetailsScreen';
import BookingScreen from './screens/BookingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import TicketsScreen from './screens/TicketsScreen'; 

import { MyDispatchContext, MyUserContext } from './services/Contexts';
import { MyUserReducer } from './services/Reducers';
import CommentScreen from './screens/CommentScreen';
import StatsScreen from './screens/StatsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack navigation cho màn hình Home và chi tiết xe buýt
const HomeStack = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }} // Ẩn header cho màn hình Home
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ headerShown: true, title: 'Chi tiết nhà xe' }}
      />
      <Stack.Screen
        name="Comment"
        component={CommentScreen}
        options={{ headerShown: true, title: 'Đánh giá và bình luận' }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ headerShown: true, title: 'Thống kê' }}
      />
    </Stack.Navigator>
    
  );
};

// Stack navigation cho màn hình tìm kiếm và chi tiết tuyến xe
const SearchStack = () => {
  return (
    <Stack.Navigator initialRouteName="Search">
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BusLineDetails"
        component={BusLineDetailsScreen}
        options={{ headerShown: true, title: 'Chuyến xe' }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ headerShown: true, title: 'Đặt vé' }}
      />
    </Stack.Navigator>
  );
};

// Stack navigation cho màn hình hồ sơ và vé
const ProfileStack = () => {
  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Tickets"
        component={TicketsScreen}
        options={{ headerShown: true, title: 'Danh sách vé' }}
      />
    </Stack.Navigator>
  );
};

// Component App chính của ứng dụng
const MyTab = () => {
  const user = useContext(MyUserContext);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#FFA500',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Trang chủ') {
            iconName ='home';
          } else if (route.name === 'SearchBus') {
            iconName = 'search';
          } else if (route.name === 'Login') {
            iconName = 'log-in';
          } else if (route.name === 'Register') {
            iconName = 'person-add';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'ProfileAcc'){
            iconName = 'person'
          } else if (route.name === 'Stats'){
            iconName = 'stats';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Trang chủ"
        component={HomeStack}
        options={{ tabBarLabel: 'Danh sách nhà xe' }}
      />
      <Tab.Screen
        name="SearchBus"
        component={SearchStack}
        options={{ tabBarLabel: 'Tìm kiếm tuyến đi' }}
      />
      {user === null ? (
        <>
          <Tab.Screen
            name="Login"
            component={LoginScreen}
            options={{ tabBarLabel: 'Đăng nhập' }}
          />
          <Tab.Screen
            name="Register"
            component={RegisterScreen}
            options={{ tabBarLabel: 'Đăng ký' }}
          />
        </>
      ) : (
        <Tab.Screen
          name="ProfileAcc"
          component={ProfileStack}
          options={{ title: 'Hồ sơ cá nhân' }}
        />
      )}
    </Tab.Navigator>
  );
};

export default function App() {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <NavigationContainer key={user ? 'user' : 'guest'}>
      <MyUserContext.Provider value={user}>
        <MyDispatchContext.Provider value={dispatch}>
          <MyTab />
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </NavigationContainer>
  );
}
