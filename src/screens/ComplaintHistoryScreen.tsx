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

interface ComplaintItem {
    id: string;
    title: string;
    description: string;
    status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK';
    date: string;
    reportId: string;
    category: string;
    image?: string;
}

const DUMMY_DATA: ComplaintItem[] = [
    {
        id: '1',
        title: 'Lampu Jalan Mati',
        description: 'Lampu jalan di blok A3 sudah mati selama 3 hari, mohon segera diperbaiki karena gelap.',
        status: 'MENUNGGU',
        date: '20 Des 2023',
        reportId: '#LPR-1029',
        category: 'Infrastruktur',
    },
    {
        id: '2',
        title: 'Sampah Menumpuk',
        description: 'Sampah belum diangkut oleh petugas kebersihan di perumahan citra selama seminggu.',
        status: 'DIPROSES',
        date: '18 Des 2023',
        reportId: '#LPR-1005',
        category: 'Lingkungan',
    },
    {
        id: '3',
        title: 'Jalan Berlubang di Jl. Sudirman',
        description: 'Lubang cukup dalam membahayakan pengendara motor, terutama saat hujan.',
        status: 'SELESAI',
        date: '10 Des 2023',
        reportId: '#LPR-0988',
        category: 'Infrastruktur',
    },
    {
        id: '4',
        title: 'Kebocoran Pipa PDAM',
        description: 'Air mengalir deras di pinggir jalan dekat pasar, sayang jika terbuang sia-sia.',
        status: 'SELESAI',
        date: '05 Des 2023',
        reportId: '#LPR-0950',
        category: 'Fasilitas Umum',
    },
];

const CATEGORIES = ['Semua', 'Menunggu', 'Diproses', 'Selesai'];

export default function ComplaintHistoryScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'MENUNGGU':
                return { bg: '#FEF3C7', text: '#D97706' };
            case 'DIPROSES':
                return { bg: '#EFF6FF', text: '#3B82F6' };
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
            (activeTab === 'Menunggu' && item.status === 'MENUNGGU') ||
            (activeTab === 'Diproses' && item.status === 'DIPROSES') ||
            (activeTab === 'Selesai' && item.status === 'SELESAI');

        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.reportId.toLowerCase().includes(searchQuery.toLowerCase());

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
                <Text style={styles.headerTitle}>Riwayat Pengaduan</Text>
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
                        placeholder="Cari ID laporan atau judul..."
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
                            <View style={styles.cardHeader}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                    <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                                </View>
                            </View>

                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                            <View style={styles.divider} />

                            <View style={styles.cardFooter}>
                                <View style={styles.footerRow}>
                                    <Icon name="calendar-outline" size={14} color="#94A3B8" />
                                    <Text style={styles.metaText}>{item.date}</Text>
                                </View>
                                <View style={styles.footerRow}>
                                    <Icon name="barcode-outline" size={14} color="#94A3B8" />
                                    <Text style={styles.metaText}>{item.reportId}</Text>
                                </View>
                                <TouchableOpacity style={styles.detailBtn}>
                                    <Text style={styles.detailBtnText}>Detail</Text>
                                    <Icon name="chevron-forward" size={14} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="chatbubble-ellipses-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>Tidak ada pengaduan ditemukan</Text>
                    </View>
                )}

                <Text style={styles.listFooterText}>Menampilkan {filteredItems.length} pengaduan terakhir</Text>
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
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        // Shadow for premium feel
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 18,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '700',
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    detailBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#3B82F6',
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
        marginTop: 8,
        letterSpacing: 0.5,
    },
});
