import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Platform,
    StatusBar,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import SkeletonShimmer from '../components/SkeletonShimmer';

// Skeleton Card for Service History
const HistoryCardSkeleton = () => (
    <View style={styles.card}>
        <SkeletonShimmer style={styles.iconContainer} />
        <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
                <SkeletonShimmer style={{ width: '60%', height: 15, marginRight: 8 }} />
                <SkeletonShimmer style={{ width: 70, height: 20 }} />
            </View>
            <SkeletonShimmer style={{ width: '90%', height: 13, marginBottom: 6 }} />
            <SkeletonShimmer style={{ width: '70%', height: 13, marginBottom: 12 }} />
            <View style={styles.cardFooter}>
                <View style={styles.metaRow}>
                    <SkeletonShimmer style={{ width: 80, height: 11 }} />
                    <View style={styles.metaDivider} />
                    <SkeletonShimmer style={{ width: 70, height: 11 }} />
                </View>
            </View>
        </View>
    </View>
);

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
        icon: 'receipt-outline',
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
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'DIPROSES':
                return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
            case 'DIAJUKAN':
                return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
            case 'SELESAI':
                return { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' };
            case 'DITOLAK':
                return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
            default:
                return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
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
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>RIWAYAT LAYANAN</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Icon name="options-outline" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabBarContent}
                >
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={styles.tabItem}
                            onPress={() => setActiveTab(cat)}
                        >
                            <Text style={[styles.tabText, activeTab === cat && styles.activeTabText]}>
                                {cat.toUpperCase()}
                            </Text>
                            {activeTab === cat && <View style={styles.tabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
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
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFB800']} />
                }
            >
                {isLoading ? (
                    <>
                        {[1, 2, 3, 4].map((_, index) => (
                            <HistoryCardSkeleton key={index} />
                        ))}
                    </>
                ) : (
                    <>
                        {filteredItems.map(item => {
                            const statusStyle = getStatusStyle(item.status);
                            return (
                                <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.7}>
                                    {/* Icon Section */}
                                    <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                                        <Icon name={item.icon} size={24} color={item.iconColor} />
                                    </View>

                                    <View style={styles.cardContent}>
                                        {/* Header with Title and Status Badge */}
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                                <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                                                <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                                            </View>
                                        </View>

                                        {/* Description */}
                                        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                                        {/* Footer Info */}
                                        <View style={styles.cardFooter}>
                                            <View style={styles.metaRow}>
                                                <View style={styles.metaItem}>
                                                    <Icon name="calendar-outline" size={13} color="#94A3B8" />
                                                    <Text style={styles.metaText}>{item.date}</Text>
                                                </View>
                                                <View style={styles.metaDivider} />
                                                <View style={styles.metaItem}>
                                                    <Icon name="document-text-outline" size={13} color="#94A3B8" />
                                                    <Text style={styles.metaText}>{item.reqId}</Text>
                                                </View>
                                            </View>

                                            {item.meta && (
                                                <View style={styles.metaBadge}>
                                                    {item.metaIcon && <Icon name={item.metaIcon} size={12} color={item.metaColor} />}
                                                    <Text style={[styles.metaBadgeText, { color: item.metaColor }]}>{item.meta}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="document-text-outline" size={48} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>Tidak Ada Riwayat</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Coba kata kunci lain' : 'Belum ada riwayat layanan'}
                        </Text>
                    </View>
                )}

                {filteredItems.length > 0 && (
                    <View style={styles.listFooter}>
                        <View style={styles.footerLine} />
                        <Text style={styles.listFooterText}>
                            MENAMPILKAN {filteredItems.length} RIWAYAT TERAKHIR
                        </Text>
                        <View style={styles.footerLine} />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
        fontSize: 16,
        fontWeight: "900",
        color: "#0F172A",
        letterSpacing: 1,
    },
    tabContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabBarContent: {
        paddingHorizontal: 12,
    },
    tabItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    activeTabText: {
        color: '#0F172A',
        fontWeight: '900',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 12,
        right: 12,
        height: 3,
        backgroundColor: '#FFB800',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconContainer: {
        width: 48,
        height: 48,
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 18,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#E2E8F0',
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
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
        textAlign: 'center',
    },
    listFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        paddingHorizontal: 24,
        gap: 12,
    },
    footerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    listFooterText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '900',
        letterSpacing: 1,
    },
});
