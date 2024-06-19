import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from "react-native";
import { Button, Avatar, Divider } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "../services/Contexts";
import { useNavigation } from "@react-navigation/native";
import { authApi } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const navigation = useNavigation(); // Hook for navigation
    const [key, setKey] = useState(0);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editedUser, setEditedUser] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
    });

    const fields = [
        { label: "Họ", icon: "account", name: "last_name" },
        { label: "Tên: ", icon: "account", name: "first_name" },
        { label: "Email: ", icon: "mail", name: "email" },
        { label: "Số điện thoại: ", icon: "phone", name: "phone" },
        { label: "Địa chỉ: ", icon: "address", name: "address"}
    ];

    const handleEditProfile = async () => {
        const token = await AsyncStorage.getItem('token');
        let formProfile = new FormData();
        formProfile.append('last_name', editedUser.last_name)
        formProfile.append('first_name', editedUser.first_name)
        formProfile.append('email', editedUser.email)
        formProfile.append('phone', editedUser.phone)
        formProfile.append('address', editedUser.address)

        try {
            const response = await authApi(token).patch(`/accounts/current-account/`, formProfile,{
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Cập nhật dữ liệu người dùng trong Context sau khi chỉnh sửa thành công
            dispatch({ type: "update_user", payload: response.data });

            setShowEditDialog(false); // Đóng modal chỉnh sửa
            reloadPage()
        } catch (error) {
            console.error("Error updating profile:", error);
            // Xử lý lỗi nếu cần
        }
    };

    const updateState = (fieldName, value) => {
        setEditedUser({
            ...editedUser,
            [fieldName]: value
        });
    };
    
    const reloadPage = () =>{
        setKey(c => c + 1);
    }

    return (
        <View key={key} style={styles.container}>
            {user && (
                <View style={styles.avatarContainer}>
                    {user.avatar ? (
                        <Avatar.Image
                            size={200}
                            source={{ uri: user.avatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <Avatar.Text
                            size={80}
                            label={`${user.first_name[0]}${user.last_name[0]}`}
                            style={styles.avatar}
                        />
                    )}
                    {user.role !== 'busowner' && (
                        <Button
                            icon="information"
                            mode="contained"
                            onPress={() => {}}
                            style={styles.infoButton}
                        >
                            Đăng ký trở thành đối tác !!
                        </Button>
                    )}
                </View>
            )}
            
            <Text style={styles.nameText}>{`${user.last_name} ${user.first_name}`}</Text>
            <Divider style={styles.divider} />
            <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoText}>{user.email}</Text>
                
                <Text style={styles.infoLabel}>Số điện thoại:</Text>
                <Text style={styles.infoText}>{user.phone}</Text>
                
                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                <Text style={styles.infoText}>{user.address}</Text>
                {/* Add more user information as needed */}
            </View>
            <Button
                icon="account-edit"
                mode="contained"
                onPress={() => {setShowEditDialog(true)}}
                style={styles.logoutButton}
            >
                Chỉnh sửa thông tin
            </Button>
            <Button
                icon="logout"
                mode="contained"
                onPress={() => dispatch({ type: "logout" })}
                style={styles.logoutButton}
            >
                Đăng xuất
            </Button>
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
                                value={editedUser[field.name]}
                                onChangeText={(text) => updateState(field.name, text)}
                                style={styles.editInput}
                            />
                        ))}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={handleEditProfile} 
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
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    avatarContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    avatar: {
        marginBottom: 20,
    },
    infoButton: {
        position: 'static',
        backgroundColor: "#FFA500",
        justifyContent:'center'
    },
    nameText: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 10,
    },
    divider: {
        height: 2,
        width: "100%",
        backgroundColor: "#ccc",
        marginVertical: 20,
    },
    infoContainer: {
        width: "100%",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 10,
    },
    logoutButton: {
        marginTop: 10,
        width: "100%",
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
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
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
});

export default ProfileScreen;
