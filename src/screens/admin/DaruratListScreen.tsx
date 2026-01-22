import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Image,
    StatusBar,
    Platform,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import useEmergencyStore, { EmergencyReport } from '../../stores/emergencyStore';
import useAuthStore from '../../stores/authStore';
import { getImageUrl } from '../../config/api';
import SkeletonShimmer from '../../components/SkeletonShimmer';

// Skeleton Card for Darurat
const DaruratCardSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
                <SkeletonShimmer style={styles.avatar} />
                <View>
                    <SkeletonShimmer style={{ width: 100, height: 12, marginBottom: 4 }} />
                    <SkeletonShimmer style={{ width: 80, height: 10 }} />
                </View>
            </View>
            <SkeletonShimmer style={{ width: 60, height: 20, borderRadius: 6 }} />
        </View>
        <SkeletonShimmer style={{ width: 120, height: 11, marginBottom: 8 }} />
        <SkeletonShimmer style={{ width: '100%', height: 14, marginBottom: 6 }} />
        <SkeletonShimmer style={{ width: '80%', height: 14, marginBottom: 12 }} />
        <View style={styles.cardFooter}>
            <SkeletonShimmer style={{ width: 100, height: 12 }} />
        </View>
    </View>
);

const STATUS_FILTERS = [
    { label: 'Semua', value: '' },
    { label: 'Menunggu', value: 'pending' },
    { label: 'Diterima', value: 'diterima' },
    { label: 'Diproses', value: 'diproses' },
    { label: 'Selesai', value: 'selesai' },
    { label: 'Dibatalkan', value: 'dibatalkan' },
];

const StatusBadge = ({ status }: { status: string }) => {
    let color = '#64748B';
    let bgColor = '#F1F5F9';
    let label = status;

    switch (status?.toLowerCase()) {
        case 'pending':
            color = '#B45309';
            bgColor = '#FEF3C7';
            label = 'Menunggu';
            break;
        case 'diterima':
            color = '#1E40AF';
            bgColor = '#DBEAFE';
            label = 'Diterima';
            break;
        case 'diproses':
            color = '#A16207';
            bgColor = '#FEF9C3';
            label = 'Diproses';
            break;
        case 'selesai':
            color = '#15803D';
            bgColor = '#DCFCE7';
            label = 'Selesai';
            break;
        case 'dibatalkan':
            color = '#B91C1C';
            bgColor = '#FEE2E2';
            label = 'Dibatalkan';
            break;
    }

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
        </View>
    );
};

export default function DaruratListScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const { reports, loading, fetchReports, error } = useEmergencyStore();
    const user = useAuthStore(state => state.user);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Initial Load & Focus Refresh
    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused, selectedStatus]);

    const loadData = async () => {
        // If user is admin for specific dinas, we might filter, but usually admin sees all relevant.
        // Assuming backend handles role-based filtering, we just pass status if selected.
        const p: any = {};
        if (selectedStatus) p.status = selectedStatus;
        if (user?.dinasId) p.dinasId = user.dinasId; // Optional: filter by admin's dinas if needed

        await fetchReports(p);
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    };

    const handleFilterPress = (status: string) => {
        if (selectedStatus === status) return;
        setSelectedStatus(status);
        // useEffect will trigger fetch
    };

    const renderItem = ({ item }: { item: EmergencyReport }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EmergencyDetail', { report: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.fullName || 'Tanpa Nama'}</Text>
                        <Text style={styles.date}>
                            {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })} WIB
                        </Text>
                    </View>
                </View>
                <StatusBadge status={item.status} />
            </View>

            {item.dinasNama && (
                <View style={styles.dinasRow}>
                    <Icon name="business" size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.dinasName}>{item.dinasNama}</Text>
                </View>
            )}

            <Text style={styles.message} numberOfLines={3}>{item.pesan}</Text>

            {item.urlFoto && (
                <Image
                    source={{ uri: getImageUrl(item.urlFoto) }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
            )}

            <View style={styles.cardFooter}>
                <View style={styles.locationTag}>
                    <Icon name="location-sharp" size={12} color="#EF4444" />
                    <Text style={styles.locationText}>
                        {item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}
                    </Text>
                </View>
                <View style={styles.chevronContainer}>
                    <Text style={styles.detailLink}>Detail</Text>
                    <Icon name="chevron-forward" size={14} color="#3B82F6" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Laporan Darurat</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
                    <Icon name="refresh" size={20} color="#64748B" />
                </TouchableOpacity>
            </View>

            {/* Status Filters */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                >
                    {STATUS_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.value}
                            style={[
                                styles.filterChip,
                                selectedStatus === filter.value && styles.activeFilterChip
                            ]}
                            onPress={() => handleFilterPress(filter.value)}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedStatus === filter.value && styles.activeFilterText
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {loading && !isRefreshing && reports.length === 0 ? (
                <View style={styles.listContent}>
                    {[1, 2, 3].map((_, index) => (
                        <DaruratCardSkeleton key={index} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={reports}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#EF4444']} />
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <FeatherIcon name="shield" size={40} color="#CBD5E1" />
                                </View>
                                <Text style={styles.emptyText}>Tidak ada laporan darurat</Text>
                                <Text style={styles.emptySubText}>
                                    Laporan darurat yang masuk akan muncul di sini.
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 0.5,
    },
    headerBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filterContent: {
        paddingHorizontal: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeFilterChip: {
        backgroundColor: '#FEF2F2',
        borderColor: '#F87171',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    activeFilterText: {
        color: '#DC2626',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Space for Fab or Bottom Tab
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    date: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    dinasRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#F8FAFC',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dinasName: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    message: {
        fontSize: 14,
        color: '#334155',
        marginBottom: 12,
        lineHeight: 22,
    },
    thumbnail: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#F1F5F9',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
    },
    chevronContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLink: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
        marginRight: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubText: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 240,
    }
});
