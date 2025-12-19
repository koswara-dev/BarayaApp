import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getImageUrl } from '../config/api';

interface EmergencyReportCardProps {
    item: {
        id: number;
        fullName: string;
        phoneNumber: string;
        pesan: string;
        urlFoto?: string;
        createdAt: string;
        latitude?: number;
        longitude?: number;
    };
    onPress?: () => void;
}

const getTimeAgo = (dateFunc: string) => {
    const date = new Date(dateFunc);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return date.toLocaleDateString();
};

export const EmergencyReportCard = ({ item, onPress }: EmergencyReportCardProps) => {
    const handleCall = () => {
        Linking.openURL(`tel:${item.phoneNumber}`);
    };

    const handleMaps = () => {
        if (item.latitude && item.longitude) {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${item.fullName}&background=random` }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.userName}>{item.fullName}</Text>
                        <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.mapBtn} onPress={handleMaps}>
                    <Icon name="location" size={16} color="#2563EB" />
                    <Text style={styles.mapText}>Lokasi</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.message}>{item.pesan}</Text>

            {item.urlFoto && (
                <Image source={{ uri: getImageUrl(item.urlFoto) }} style={styles.evidenceImage} resizeMode="cover" />
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                    <Icon name="call" size={18} color="#FFFFFF" />
                    <Text style={styles.actionText}>Hubungi</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={onPress}>
                    <Text style={[styles.actionText, styles.secondaryText]}>Detail Laporan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    time: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    mapText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2563EB',
        marginLeft: 4,
    },
    message: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 12,
    },
    evidenceImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#F1F5F9',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    secondaryBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    secondaryText: {
        color: '#64748B',
    },
});
