import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button, Avatar, Divider } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "../services/Contexts";
import { useNavigation } from "@react-navigation/native"; // Import navigation hook

const ProfileScreen = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const navigation = useNavigation(); // Hook for navigation

    const handleEditProfile = () => {
        navigation.navigate("EditProfile"); // Navigate to EditProfile screen
    };

    return (
        <View style={styles.container}>
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
                onPress={handleEditProfile}
                style={styles.editButton}
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
        </View>
    );
}
""
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    avatar: {
        marginBottom: 20,
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
    editButton: {
        marginTop: 10,
        width: "100%",
        backgroundColor: "#ffab00",
    },
    logoutButton: {
        marginTop: 10,
        width: "100%",
    },
});

export default ProfileScreen;
