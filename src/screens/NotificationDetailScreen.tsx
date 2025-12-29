import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import useNotificationStore from '../stores/notificationStore';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = DAYS[date.getDay()];
    const d = date.getDate();
    const m = MONTHS[date.getMonth()];
    const y = date.getFullYear();
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${day}, ${d} ${m} ${y} • ${time}`;
};

export default function NotificationDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { id } = route.params as { id: string };
    const { getNotificationById } = useNotificationStore();

    const [notification, setNotification] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                const data = await getNotificationById(id);
                setNotification(data);
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!notification) {
        return (
            <View style={styles.errorContainer}>
                <Text>Notifikasi tidak ditemukan</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Kembali</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Determine icon based on category/title similar to list
    let icon = 'megaphone';
    let iconColor = '#3B82F6';
    const titleLower = (notification.judul || '').toLowerCase();

    if (titleLower.includes('darurat') || titleLower.includes('peringatan') || titleLower.includes('bencana')) {
        icon = 'warning';
        iconColor = '#EF4444';
    } else if (titleLower.includes('tagihan') || titleLower.includes('pembayaran')) {
        icon = 'cash';
        iconColor = '#10B981';
    } else if (titleLower.includes('listrik') || titleLower.includes('pln')) {
        icon = 'flash';
        iconColor = '#F59E0B';
    } else if (titleLower.includes('update') || titleLower.includes('aplikasi')) {
        icon = 'refresh';
        iconColor = '#64748B';
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Notifikasi</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                        <Icon name={icon} size={40} color={iconColor} />
                    </View>
                </View>

                <Text style={styles.title}>{notification.judul}</Text>
                <Text style={styles.date}>{formatDateTime(notification.createdAt || new Date().toISOString())}</Text>

                <View style={styles.divider} />

                <Text style={styles.message}>{notification.pesan}</Text>

                {/* Additional Info if available */}
                {notification.category && (
                    <View style={styles.metaContainer}>
                        <Text style={styles.metaLabel}>Kategori:</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{notification.category}</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 24,
    },
    message: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 26,
    },
    metaContainer: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 14,
        color: '#64748B',
        marginRight: 8,
    },
    badge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    backButton: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontWeight: '600',
    }
});
