import React, { useContext } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api, { authApi } from "../services/api";
import { MyDispatchContext } from "../services/Contexts";

const LoginScreen = () => {
    const [user, setUser] = React.useState({});
    const fields = [{
        "label": "Tên đăng nhập",
        "icon": "account",
        "name": "username"
    }, {
        "label": "Mật khẩu",
        "icon": "eye",
        "name": "password",
        "secureTextEntry": true
    }];
    const [loading, setLoading] = React.useState(false);
    const nav = useNavigation();
    const dispatch = useContext(MyDispatchContext);

    const updateState = (field, value) => {
        setUser(current => ({
            ...current,
            [field]: value
        }));
    }

    const login = async () => {
        setLoading(true);
        try {
            const { username, password } = user;
            if (!username || !password) {
                Alert.alert("Lỗi", "Tên đăng nhập và mật khẩu là bắt buộc");
                setLoading(false);
                return;
            }
            // const nowUTC = new Date().toUTCString();
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            formData.append('client_id', 'i33Yo3r5br8eAAIyMN7z6XagwFbTueqAbS5uq4DH');
            formData.append('client_secret', 'ebXZ42ESauVMnWKaVFoY3TS7cuEFrqnI3itV4VC6Qer9vEkJ6Sb3wuBJk4ZTW6nkpd50y3ChcscURENj4NvuFuy45ebhYmb1w4CzvlAYKm6tX7dzzKU3Kue7Mgsi5pEj');
            formData.append('grant_type', 'password');
    
            const res = await api.post('/o/token/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            await AsyncStorage.setItem("token", res.data.access_token);
    
    
           setTimeout(async() =>{
            let userData = await authApi(res.data.access_token).get('/accounts/current-account/');
            console.info(userData.data)
            dispatch({
                type: "login",
                payload: userData.data
            });
           }, 1000);
    
            nav.navigate('Home'); // Navigate to the 'Trang chủ' screen (List of bus stations)
    
        } catch (ex) {
            if (ex.response) {
                console.error('Error response:', ex.response.data);
                Alert.alert("Lỗi đăng nhập", ex.response.data.error_description || "Thông tin đăng nhập không hợp lệ");
            } else if (ex.request) {
                console.error('Error request:', ex.request);
                Alert.alert("Lỗi mạng", "Vui lòng kiểm tra kết nối internet và thử lại");
            } else {
                console.error('Error message:', ex.message);
                Alert.alert("Lỗi", ex.message);
            }
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>ĐĂNG NHẬP NGƯỜI DÙNG</Text>
                {fields.map((field) => (
                    <TextInput
                        key={field.name}
                        label={field.label}
                        value={user[field.name]}
                        onChangeText={(text) => updateState(field.name, text)}
                        style={styles.input}
                        secureTextEntry={field.secureTextEntry}
                        right={({ color }) => <TextInput.Icon name={field.icon} color={color} />}
                    />
                ))}
                <Button
                    icon="account"
                    loading={loading}
                    mode="contained"
                    onPress={login}
                    style={[styles.button, { backgroundColor: '#FFA500' }]} // Thay đổi màu của nút sang màu cam
                    color="#fff" // Màu văn bản của nút là trắng
                >
                    ĐĂNG NHẬP
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    content: {
        width: '100%',
        maxWidth: 400,
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        elevation: 4, // shadow on Android
        shadowColor: '#000', // shadow on iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginTop: 20,
        borderRadius: 5,
    },
});

export default LoginScreen;
