import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from "react-native";
import { Button, Avatar, Divider, HelperText, IconButton } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "../services/Contexts";
import { useNavigation } from "@react-navigation/native";
import { authApi } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = () => {

    const [isEditing, setIsEditing] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [businforEle, setBusinforEle] = useState({});
    const [errorMessage, setErrorMessage] = useState('')


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


    const fieldBusinfor = [
        { label: "Mã nhà xe: ", icon: "account", name: "code" },
        { label: "Tên nhà xe:", icon: "account", name: "name" },
        { label: "Email nhà xe: ", icon: "mail", name: "email" },
        { label: "Số điện thoại nhà xe: ", icon: "phone", name: "phone" },
    ];

    const fields = [
        { label: "Họ", icon: "account", name: "last_name" },
        { label: "Tên: ", icon: "account", name: "first_name" },
        { label: "Email: ", icon: "mail", name: "email" },
        { label: "Số điện thoại: ", icon: "phone", name: "phone" },
        { label: "Địa chỉ: ", icon: "address", name: "address" }
    ];

    const handleBusinfor = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            let response = await authApi(token).post('/businfors/', {
                "code": businforEle.code,
                "name": businforEle.name,
                "email": businforEle.email,
                "phone": businforEle.phone,
            }
            );
            setIsEditing(false);
            Alert.alert("Đăng kí thành công, đang chờ duyệt.");
            console.log("Đăng kí thành công, đang chờ duyệt.");
            setBusinforEle({})
            
            console.log(response.status);
        } catch (ex) {
            if (ex.response) {
                // Có phản hồi từ máy chủ
                console.log(ex.response.status); // Mã trạng thái HTTP
                console.log(ex.response.headers); // Header phản hồi
                console.log(ex.response.data); // Dữ liệu phản hồi từ máy chủ
                if (ex.response.status === 400) {
                    Alert.alert("Mã nhà xe đã bị trùng.");
                    console.log("Mã nhà xe đã bị trùng.");
                    setErrorMessage("Mã nhà xe đã bị trùng.");
                } else if (ex.response.status === 500) {
                    console.log("Tài khoản đã đăng kí nhà xe.");
                    setErrorMessage("Tài khoản đã đăng kí nhà xe.");
                } else {
                    console.log("Lỗi không xác định từ máy chủ.");
                }
            } else {
                // Lỗi ngoại lệ không có phản hồi từ máy chủ
                console.log(ex.message);
            }
        }
    };

    const updateStateBusInfor = (fieldName, value) => {
        setBusinforEle({
            ...businforEle,
            [fieldName]: value,
        });
    };


    const handleEditProfile = async () => {
        const token = await AsyncStorage.getItem('token');
        let formProfile = new FormData();
        formProfile.append('last_name', editedUser.last_name)
        formProfile.append('first_name', editedUser.first_name)
        formProfile.append('email', editedUser.email)
        formProfile.append('phone', editedUser.phone)
        formProfile.append('address', editedUser.address)

        try {
            const response = await authApi(token).patch(`/accounts/current-account/`, formProfile, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Cập nhật dữ liệu người dùng trong Context sau khi chỉnh sửa thành công
            dispatch({ type: "update_user", payload: response.data });

            setShowEditDialog(false); // Đóng modal chỉnh sửa
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

    return (
        <View style={styles.container}>
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
                            onPress={() => { setIsEditing(true) }}
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
                onPress={() => { setShowEditDialog(true) }}
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
            <Modal
                visible={isEditing}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsEditing(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.editDialog}>
                        <Text style={styles.editDialogTitle}>ĐĂNG KÝ ĐỐI TÁC</Text>
                        {fieldBusinfor.map((field) => (
                            <TextInput
                                key={field.name}
                                placeholder={field.label}
                                value={businforEle[field.name]}
                                onChangeText={(text) => updateStateBusInfor(field.name, text)}
                                style={styles.editInput}
                            />
                        ))}
                        <HelperText type="error" visible={errorMessage !== ""}>
                            {errorMessage}
                        </HelperText>

                        <View style={{ width: "100%", marginBottom: 10 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Quy định đăng ký nhà xe</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setIsAgreed(!isAgreed)}
                        >
                            <View style={styles.checkbox}>
                                {isAgreed && (
                                    <IconButton
                                        iconColor={isAgreed ? "blue" : "gray"}
                                        size={20}
                                        icon={
                                            isAgreed ? "checkbox-marked" : "checkbox-blank-outline"
                                        }
                                    />
                                )}
                            </View>
                            <Text style={styles.checkboxText}>
                                Tôi đồng ý với các Điều khoản và Điều kiện
                            </Text>
                        </TouchableOpacity>


                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[
                                    styles.editButton,
                                    { backgroundColor: isAgreed ? "#ffab00" : "gray" },
                                ]}
                                disabled={!isAgreed}
                                onPress={handleBusinfor}

                            >
                                <Text style={styles.editButtonText}>Gửi yêu cầu</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.editButtonCancel}
                                onPress={() => setIsEditing(false)}
                            >
                                <Text style={styles.editButtonText}>Thoát</Text>
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
        justifyContent: 'center'
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
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
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
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        // Thiết lập kiểu dáng cho checkbox container
    },
    checkbox: {
        width: 25,
        height: 25,
        borderRadius: 5,
        backgroundColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
        // Thiết lập kiểu dáng cho checkbox
    },
    checkboxText: {
        marginLeft: 10,
        // Thiết lập kiểu dáng cho checkbox text
    },

});

export default ProfileScreen;
