import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface CustomAlertProps {
    visible: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}

export default function CustomAlert({ visible, title = 'Berhasil!', message, onClose }: CustomAlertProps) {
    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconCircle}>
                        <Icon name="checkmark" size={40} color="#FFFFFF" />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>LANJUTKAN</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    container: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: -60, // Memunculkan ikon menggantung di atas (Shopee style pop)
        borderWidth: 6,
        borderColor: '#FFFFFF',
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 10,
    },
    message: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        height: 52,
        backgroundColor: '#EE4D2D', // Shopee Orange/Red
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 26, // Rounded pill shape
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
