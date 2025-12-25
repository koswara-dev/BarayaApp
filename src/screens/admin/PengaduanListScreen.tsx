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
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import usePengaduanStore from '../../stores/pengaduanStore';
import { getImageUrl } from '../../config/api';
import SkeletonShimmer from '../../components/SkeletonShimmer';

// Skeleton Card for Admin Pengaduan
const PengaduanCardSkeleton = () => (
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
        <SkeletonShimmer style={styles.thumbnail} />
        <View style={styles.cardFooter}>
            <SkeletonShimmer style={{ width: 100, height: 12 }} />
        </View>
    </View>
);

const StatusBadge = ({ status }: { status: string }) => {
    let color = '#64748B';
    let bgColor = '#F1F5F9';
    let label = status;

    switch (status?.toLowerCase()) {
        case 'diajukan':
            color = '#3B82F6';
            bgColor = '#EFF6FF';
            label = 'Diajukan';
            break;
        case 'diproses':
            color = '#F59E0B';
            bgColor = '#FFFBEB';
            label = 'Diproses';
            break;
        case 'selesai':
            color = '#10B981';
            bgColor = '#ECFDF5';
            label = 'Selesai';
            break;
        case 'ditolak':
            color = '#EF4444';
            bgColor = '#FEF2F2';
            label = 'Ditolak';
            break;
    }

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
        </View>
    );
};

export default function AdminPengaduanListScreen() {
    const navigation = useNavigation<any>();
    const { list, loading, fetchPengaduan, hasMore, page } = usePengaduanStore();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            await fetchPengaduan({ page: 0 });
            setIsInitialLoad(false);
        };
        loadData();
    }, []);

    const onRefresh = () => {
        fetchPengaduan({ page: 0 });
    };

    const onLoadMore = () => {
        if (hasMore && !loading) {
            fetchPengaduan({ page: page + 1, isLoadMore: true });
        }
    };

    const showSkeleton = isInitialLoad && loading;

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AdminPengaduanDetail', { item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.userNama?.charAt(0) || 'U'}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.userNama}</Text>
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

            <Text style={styles.dinasName}>
                <Icon name="business" size={12} color="#64748B" /> {item.dinasNama}
            </Text>

            <Text style={styles.message} numberOfLines={3}>{item.pesan}</Text>

            {item.urlFoto && (
                <Image
                    source={{ uri: getImageUrl(item.urlFoto) }}
                    style={styles.thumbnail}
                />
            )}

            <View style={styles.cardFooter}>
                <Text style={styles.detailLink}>Kelola Laporan</Text>
                <Icon name="arrow-forward" size={12} color="#3B82F6" />
            </View>
        </TouchableOpacity>
    );

    const renderSkeletonList = () => (
        <View style={styles.listContent}>
            {[1, 2, 3].map((_, index) => (
                <PengaduanCardSkeleton key={index} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Laporan</Text>
                <View style={{ width: 40 }} />
            </View>

            {showSkeleton ? (
                renderSkeletonList()
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading && page === 0 && !isInitialLoad} onRefresh={onRefresh} colors={['#F59E0B']} />
                    }
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loading && page > 0 ? <ActivityIndicator size="small" color="#F59E0B" style={{ margin: 20 }} /> : null
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Icon name="document-text-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>Belum ada laporan masuk</Text>
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
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        // Shadow
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    userName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    date: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dinasName: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#334155',
        marginBottom: 12,
        lineHeight: 20,
    },
    thumbnail: {
        width: '100%',
        height: 160,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F1F5F9',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    detailLink: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
        marginRight: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    }
});
