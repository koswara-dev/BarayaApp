import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Ya",
    cancelText = "Batal",
    type = 'danger'
}) => {
    // Determine colors based on type
    const getIconColor = () => {
        switch (type) {
            case 'danger': return '#EF4444';
            case 'success': return '#10B981';
            case 'info': return '#3B82F6';
            default: return '#EF4444';
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'danger': return '#FEE2E2';
            case 'success': return '#D1FAE5';
            case 'info': return '#DBEAFE';
            default: return '#FEE2E2';
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'danger': return 'alert-circle-outline';
            case 'success': return 'checkmark-circle-outline';
            case 'info': return 'information-circle-outline';
            default: return 'alert-circle-outline';
        }
    };

    const getConfirmBtnStyle = () => {
        switch (type) {
            case 'danger': return styles.modalBtnDanger;
            case 'success': return styles.modalBtnSuccess;
            case 'info': return styles.modalBtnInfo;
            default: return styles.modalBtnDanger;
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* <View style={[styles.modalIconContainer, { backgroundColor: getIconBgColor() }]}>
                        <Icon name={getIconName()} size={32} color={getIconColor()} />
                    </View> */}

                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.modalBtnCancel]}
                            onPress={onCancel}
                        >
                            <Text style={styles.modalBtnTextCancel}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalBtn, getConfirmBtnStyle()]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.modalBtnTextConfirm}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 0,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnCancel: {
        backgroundColor: '#F1F5F9',
    },
    modalBtnDanger: {
        backgroundColor: '#EF4444',
    },
    modalBtnSuccess: {
        backgroundColor: '#10B981',
    },
    modalBtnInfo: {
        backgroundColor: '#3B82F6',
    },
    modalBtnTextCancel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    modalBtnTextConfirm: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
});
