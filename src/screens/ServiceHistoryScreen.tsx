import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

interface HistoryItem {
    id: string;
    title: string;
    description: string;
    status: 'DIPROSES' | 'DIAJUKAN' | 'SELESAI' | 'DITOLAK';
    date: string;
    reqId: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    meta?: string;
    metaIcon?: string;
    metaColor?: string;
}

const DUMMY_DATA: HistoryItem[] = [
    {
        id: '1',
        title: 'Pembuatan E-KTP Baru',
        description: 'Permohonan cetak ulang KTP karena patah.',
        status: 'DIPROSES',
        date: '12 Okt 2023',
        reqId: '#REQ-9921',
        icon: 'id-card-outline',
        iconBg: '#EFF6FF',
        iconColor: '#3B82F6',
    },
    {
        id: '2',
        title: 'Pecah Kartu Keluarga',
        description: 'Pemisahan KK untuk anggota keluarga baru.',
        status: 'DIAJUKAN',
        date: '10 Okt 2023',
        reqId: '#REQ-8750',
        icon: 'people-outline',
        iconBg: '#FFFBEB',
        iconColor: '#D97706',
    },
    {
        id: '3',
        title: 'Akta Kelahiran',
        description: 'Penerbitan akta kelahiran anak ke-2.',
        status: 'SELESAI',
        date: '25 Sep 2023',
        reqId: '#REQ-6542',
        icon: ' receipt-outline',
        iconBg: '#F0FDF4',
        iconColor: '#10B981',
        meta: 'Diambil',
        metaIcon: 'checkmark-circle',
        metaColor: '#10B981',
    },
    {
        id: '4',
        title: 'Surat Izin Usaha (IUMK)',
        description: 'Izin usaha mikro kecil sektor kuliner.',
        status: 'SELESAI',
        date: '14 Ags 2023',
        reqId: '#REQ-4321',
        icon: 'storefront-outline',
        iconBg: '#F0FDF4',
        iconColor: '#10B981',
        meta: 'Digital',
        metaIcon: 'checkmark-circle',
        metaColor: '#10B981',
    },
    {
        id: '5',
        title: 'Surat Pindah Domisili',
        description: 'Dokumen pendukung kurang lengkap.',
        status: 'DITOLAK',
        date: '01 Jul 2023',
        reqId: '#REQ-1102',
        icon: 'location-outline',
        iconBg: '#FEF2F2',
        iconColor: '#EF4444',
        meta: 'Perlu Revisi',
        metaIcon: 'alert-circle',
        metaColor: '#EF4444',
    },
];

const CATEGORIES = ['Semua', 'Dalam Proses', 'Selesai', 'Ditolak'];

export default function ServiceHistoryScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DIPROSES':
                return { bg: '#EFF6FF', text: '#3B82F6' };
            case 'DIAJUKAN':
                return { bg: '#FFFBEB', text: '#D97706' };
            case 'SELESAI':
                return { bg: '#F0FDF4', text: '#10B981' };
            case 'DITOLAK':
                return { bg: '#FEF2F2', text: '#EF4444' };
            default:
                return { bg: '#F1F5F9', text: '#64748B' };
        }
    };

    const filteredItems = DUMMY_DATA.filter(item => {
        const matchesTab = activeTab === 'Semua' ||
            (activeTab === 'Dalam Proses' && (item.status === 'DIPROSES' || item.status === 'DIAJUKAN')) ||
            (activeTab === 'Selesai' && item.status === 'SELESAI') ||
            (activeTab === 'Ditolak' && item.status === 'DITOLAK');

        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.reqId.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Riwayat Layanan</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Icon name="options-outline" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.tabItem, activeTab === cat && styles.activeTabItem]}
                        onPress={() => setActiveTab(cat)}
                    >
                        <Text style={[styles.tabText, activeTab === cat && styles.activeTabText]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Icon name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nomor tiket atau layanan..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredItems.map(item => {
                    const statusStyle = getStatusStyle(item.status);
                    return (
                        <TouchableOpacity key={item.id} style={styles.card}>
                            <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                                <Icon name={item.icon} size={24} color={item.iconColor} />
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                                    </View>
                                </View>

                                <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>

                                <View style={styles.cardFooter}>
                                    <View style={styles.footerRow}>
                                        <View style={styles.metaItem}>
                                            <Icon name="calendar-outline" size={14} color="#94A3B8" />
                                            <Text style={styles.metaText}>{item.date}</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Icon name="copy-outline" size={14} color="#94A3B8" />
                                            <Text style={styles.metaText}>{item.reqId}</Text>
                                        </View>
                                    </View>

                                    {item.meta && (
                                        <View style={styles.metaBadge}>
                                            {item.metaIcon && <Icon name={item.metaIcon} size={14} color={item.metaColor} />}
                                            <Text style={[styles.metaBadgeText, { color: item.metaColor }]}>{item.meta}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="document-text-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Tidak ada riwayat ditemukan</Text>
                    </View>
                )}

                <Text style={styles.listFooterText}>Menampilkan {filteredItems.length} layanan terakhir</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#0F172A",
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingHorizontal: 8,
    },
    tabItem: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {
        borderBottomColor: '#FFB800',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    activeTabText: {
        color: '#0F172A',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        backgroundColor: '#FCFDFF',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaBadgeText: {
        fontSize: 11,
        fontWeight: '900',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    listFooterText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        marginTop: 24,
        letterSpacing: 0.5,
    },
});
