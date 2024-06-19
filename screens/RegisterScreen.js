import React from "react";
import { View, Text, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Button, HelperText, TextInput, TouchableRipple } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import api from "../services/api";

const RegisterScreen = () => {
    const [user, setUser] = React.useState({});
    const [err, setErr] = React.useState(false);
    const fields = [
        { label: "Tên", icon: "text", name: "first_name" },
        { label: "Họ và tên lót", icon: "text", name: "last_name" },
        { label: "Tên đăng nhập", icon: "account", name: "username" },
        { label: "Mật khẩu", icon: "eye", name: "password", secureTextEntry: true },
        { label: "Xác nhận mật khẩu", icon: "eye", name: "confirm", secureTextEntry: true }
    ];
    const nav = useNavigation();
    const [loading, setLoading] = React.useState(false);

    const picker = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("iCourseApp", "Permissions Denied!");
        } else {
            let res = await ImagePicker.launchImageLibraryAsync();
            if (!res.cancelled) {
                updateState("avatar", res.assets[0]);
            }
        }
    }

    const updateState = (field, value) => {
        setUser(current => ({
            ...current,
            [field]: value
        }));
    }

    const register = async () => {
        if (user.password !== user.confirm) {
            setErr(true);
            return;
        }
        setErr(false);

        const form = new FormData();
        form.append('role','customer')
        form.append('first_name', user['first_name']);
        form.append('last_name', user['last_name']);
        form.append('username', user['username']);
        form.append('password', user['password']);
        form.append('phone', user['username']); // Viết kiểm soát nhập username

        if (user.avatar) {
            form.append('avatar', {
                uri: user.avatar.uri,
                type: 'image/jpeg',
                name: 'avatar.jpg'
            });
        }
        else {
            from.append('avatar', null);
        }

        setLoading(true);
    
        try {
            const res = await api.post('/accounts/', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 10000  // 10 seconds timeout
            });

            if (res.status === 201) {
                nav.navigate("Login");
            } else {
                Alert.alert("Lỗi đăng ký", "Đăng ký không thành công. Vui lòng thử lại.");
            }
        } catch (ex) {
            console.error('Error during registration:', ex);
            if (ex.response) {
                Alert.alert("Lỗi đăng ký", ex.response.data.detail || "Thông tin đăng ký không hợp lệ");
            } else if (ex.request) {
                Alert.alert("Lỗi mạng", "Vui lòng kiểm tra kết nối internet và thử lại");
            } else {
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
                <Text style={styles.title}>ĐĂNG KÝ NGƯỜI DÙNG</Text>

                {fields.map(field => (
                    <TextInput
                        key={field.name}
                        label={field.label}
                        value={user[field.name]}
                        onChangeText={text => updateState(field.name, text)}
                        style={styles.input}
                        secureTextEntry={field.secureTextEntry}
                        right={({ color }) => <TextInput.Icon name={field.icon} color={color} />}
                    />
                ))}

                <HelperText type="error" visible={err}>
                    Mật khẩu không khớp!
                </HelperText>

                <TouchableRipple onPress={picker}>
                    <Text style={styles.avatarText}>Chọn ảnh đại diện...</Text>
                </TouchableRipple>

                {user.avatar && (
                    <Image
                        source={{ uri: user.avatar.uri }}
                        style={styles.avatarImage}
                    />
                )}

                <Button
                    icon="account"
                    loading={loading}
                    mode="contained"
                    onPress={register}
                    style={[styles.button, { backgroundColor: '#FFA500' }]} // Thay đổi màu của nút sang màu cam
                    color="#fff" // Màu văn bản của nút là trắng
                >
                    ĐĂNG KÝ
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
        fontSize: 23,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        marginBottom: 10,
    },
    avatarText: {
        marginBottom: 10,
        textAlign: 'center',
        color: '#007BFF', // Màu của văn bản chọn ảnh đại diện
    },
    avatarImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        alignSelf: 'center',
        marginVertical: 10,
    },
    button: {
        marginTop: 20,
        borderRadius: 5,
    },
});

export default RegisterScreen;
