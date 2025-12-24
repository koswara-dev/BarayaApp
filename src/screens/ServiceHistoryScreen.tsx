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
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useLayananStore from '../stores/layananStore';

export default function ServiceHistoryScreen() {
    const navigation = useNavigation();
    const { layanan, loading, fetchLayanan } = useLayananStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLayanan({ page: 0, size: 100 });
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLayanan({ page: 0, size: 100 });
        setRefreshing(false);
    };

    const filteredItems = layanan.filter(item => {
        const matchesSearch =
            item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.dinasNama?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const getServiceIcon = (nama: string): string => {
        const namaLower = nama.toLowerCase();
        if (namaLower.includes('pendidikan') || namaLower.includes('sekolah')) return 'school-outline';
        if (namaLower.includes('kesehatan') || namaLower.includes('rumah sakit')) return 'medical-outline';
        if (namaLower.includes('ktp') || namaLower.includes('identitas')) return 'id-card-outline';
        if (namaLower.includes('keluarga') || namaLower.includes('kk')) return 'people-outline';
        if (namaLower.includes('izin') || namaLower.includes('perizinan')) return 'document-text-outline';
        if (namaLower.includes('pajak')) return 'cash-outline';
        if (namaLower.includes('pertanian') || namaLower.includes('pangan')) return 'leaf-outline';
        if (namaLower.includes('transportasi') || namaLower.includes('jalan')) return 'car-outline';
        if (namaLower.includes('lingkungan')) return 'earth-outline';
        return 'clipboard-outline';
    };

    const getServiceColor = (index: number) => {
        const colors = [
            { bg: '#EFF6FF', color: '#3B82F6' },
            { bg: '#F0FDF4', color: '#10B981' },
            { bg: '#FFFBEB', color: '#F59E0B' },
            { bg: '#FEF2F2', color: '#EF4444' },
            { bg: '#F5F3FF', color: '#8B5CF6' },
            { bg: '#FDF4FF', color: '#D946EF' },
        ];
        return colors[index % colors.length];
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daftar Layanan</Text>
                <View style={styles.headerBtn} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Icon name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari layanan atau dinas..."
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
                {loading && !refreshing && layanan.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFB800" />
                        <Text style={styles.loadingText}>Memuat layanan...</Text>
                    </View>
                ) : filteredItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="search-outline" size={48} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'Tidak Ditemukan' : 'Belum Ada Layanan'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Coba kata kunci lain' : 'Belum ada layanan tersedia'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {filteredItems.map((item, index) => {
                            if (!item || !item.id) return null;

                            const iconColor = getServiceColor(index);
                            const serviceIcon = getServiceIcon(item.nama || '');
                            const hasEstimasi = item.estimasiWaktu && typeof item.estimasiWaktu === 'number' && item.estimasiWaktu > 0;
                            const hasPhone = item.phoneNumber && String(item.phoneNumber).length > 0;

                            return (
                                <TouchableOpacity key={`service-${item.id}`} style={styles.card}>
                                    {/* Icon Section */}
                                    <View style={[styles.iconContainer, { backgroundColor: iconColor.bg }]}>
                                        <Icon name={serviceIcon} size={24} color={iconColor.color} />
                                    </View>

                                    <View style={styles.cardContent}>
                                        {/* Header with Title */}
                                        <Text style={styles.cardTitle} numberOfLines={2}>
                                            {item.nama ? String(item.nama) : 'Layanan'}
                                        </Text>

                                        {/* Description */}
                                        <Text style={styles.cardDesc} numberOfLines={2}>
                                            {item.deskripsi ? String(item.deskripsi) : 'Tidak ada deskripsi'}
                                        </Text>

                                        {/* Dinas Badge */}
                                        {item.dinasNama ? (
                                            <View style={styles.dinasBadge}>
                                                <Icon name="business-outline" size={12} color="#64748B" />
                                                <Text style={styles.dinasText} numberOfLines={1}>
                                                    {String(item.dinasNama)}
                                                </Text>
                                            </View>
                                        ) : null}

                                        {/* Footer with Meta Info */}
                                        <View style={styles.cardFooter}>
                                            <View style={styles.metaRow}>
                                                {hasEstimasi ? (
                                                    <View style={styles.metaItem}>
                                                        <Icon name="time-outline" size={13} color="#64748B" />
                                                        <Text style={styles.metaText}>
                                                            {String(item.estimasiWaktu)} hari
                                                        </Text>
                                                    </View>
                                                ) : null}
                                                {hasPhone ? (
                                                    <View style={styles.metaItem}>
                                                        {hasEstimasi ? <View style={styles.metaDivider} /> : null}
                                                        <Icon name="call-outline" size={13} color="#64748B" />
                                                        <Text style={styles.metaText}>Kontak</Text>
                                                    </View>
                                                ) : null}
                                            </View>

                                            <TouchableOpacity style={styles.detailBtn}>
                                                <Text style={styles.detailBtnText}>Detail</Text>
                                                <Icon name="chevron-forward" size={16} color="#FFB800" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {filteredItems.length > 0 ? (
                            <View style={styles.footerContainer}>
                                <View style={styles.footerDivider} />
                                <Text style={styles.footerText}>
                                    {'Menampilkan ' + String(filteredItems.length) + ' layanan'}
                                </Text>
                            </View>
                        ) : null}
                    </>
                )}

                <View style={{ height: 20 }} />
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
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 20,
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 18,
        marginBottom: 8,
    },
    dinasBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    dinasText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#D97706',
        textTransform: 'uppercase',
        marginLeft: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#E2E8F0',
    },
    metaText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
        marginLeft: 4,
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailBtnText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#FFB800',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F8FAFC',
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
    footerContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerDivider: {
        width: 60,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginBottom: 12,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
