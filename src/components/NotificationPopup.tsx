import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const NOTIFICATIONS = [
    {
        id: 1,
        title: 'KTP Elektronik Selesai',
        message: 'Permohonan cetak ulang KTP Anda telah selesai diproses. Silakan ambil di kantor...',
        time: 'Baru saja',
        type: 'success',
        icon: 'checkmark-circle'
    },
    {
        id: 2,
        title: 'Jatuh Tempo Pajak',
        message: 'Jangan lupa, Pajak Kendaraan Bermotor (PKB) B 1234 XYZ jatuh tempo dalam 3 hari lagi.',
        time: '2 jam yang lalu',
        type: 'warning',
        icon: 'warning'
    },
    {
        id: 3,
        title: 'Pemeliharaan Sistem',
        message: 'Layanan perpajakan online akan mengalami gangguan sementara pada jam 02:00 - 04:00 WIB.',
        time: 'Kemarin, 14:00',
        type: 'info',
        icon: 'information-circle'
    },
    {
        id: 4,
        title: 'Layanan SIM Keliling',
        message: 'Jadwal SIM Keliling minggu ini sudah tersedia. Cek lokasi terdekat dari rumah Anda.',
        time: 'Kemarin, 09:15',
        type: 'info',
        icon: 'megaphone'
    }
];

interface NotificationPopupProps {
    visible: boolean;
    onClose: () => void;
}

export default function NotificationPopup({ visible, onClose }: NotificationPopupProps) {
    if (!visible) return null;

    return (
        <>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notifikasi</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Icon name="checkmark-done-outline" size={20} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Icon name="settings-outline" size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                            <Text style={[styles.tabText, styles.activeTabText]}>Semua</Text>
                            <View style={styles.counterBadge}>
                                <Text style={styles.counterText}>4</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tab}>
                            <Text style={styles.tabText}>Terbaru</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tab}>
                            <Text style={styles.tabText}>Dibaca</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* List */}
                <ScrollView style={styles.listContainer}>
                    <Text style={styles.sectionHeader}>HARI INI</Text>
                    {NOTIFICATIONS.slice(0, 2).map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={[styles.iconContainer, { backgroundColor: item.type === 'success' ? '#ECFDF5' : item.type === 'warning' ? '#FFFBEB' : '#EFF6FF' }]}>
                                <Icon
                                    name={item.icon}
                                    size={24}
                                    color={item.type === 'success' ? '#10B981' : item.type === 'warning' ? '#F59E0B' : '#3B82F6'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemTime}>{item.time}</Text>
                                </View>
                                <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                            </View>
                            {item.type === 'warning' && <View style={styles.dot} />}
                        </View>
                    ))}

                    <Text style={styles.sectionHeader}>KEMARIN</Text>
                    {NOTIFICATIONS.slice(2).map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={[styles.iconContainer, { backgroundColor: item.type === 'success' ? '#ECFDF5' : item.type === 'warning' ? '#FFFBEB' : '#EFF6FF' }]}>
                                <Icon
                                    name={item.icon}
                                    size={24}
                                    color={item.type === 'success' ? '#10B981' : item.type === 'warning' ? '#F59E0B' : '#3B82F6'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Text style={styles.itemTime}>{item.time}</Text>
                                </View>
                                <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 20 }} />
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 998,
        // backgroundColor: 'rgba(0,0,0,0.2)', // Optional: dim background
    },
    container: {
        position: 'absolute',
        top: 90, // Below header
        left: 16,
        right: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        height: 550, // Fixed height or max height
        maxHeight: height * 0.7,
        zIndex: 999,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    tabsContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    tabText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#FFF',
    },
    counterBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 6,
    },
    counterText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: '700',
    },
    listContainer: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 8,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginRight: 8,
    },
    itemTime: {
        fontSize: 11,
        color: '#3B82F6', // Blue for "Baru saja" feel
    },
    itemMessage: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    dot: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    }
});
