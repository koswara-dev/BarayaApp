import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export default function LoadingOverlay({ visible, message = 'Mohon tunggu...' }: LoadingOverlayProps) {
    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#FFB800" />
                    <Text style={styles.message}>{message}</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)', // Background shadow transparan (dimmed)
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 24,
        backgroundColor: '#FFFFFF', // Kotak loading tetap putih (opaque)
        alignItems: 'center',
        borderRadius: 0, // Tanpa rounded
        elevation: 0, // Tanpa shadow
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
});
