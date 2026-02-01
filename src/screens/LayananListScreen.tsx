import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDebounce } from 'use-debounce';
import useLayananStore from '../stores/layananStore';
import useAuthStore from '../stores/authStore';
import SkeletonShimmer from '../components/SkeletonShimmer';
import { getImageUrl } from '../config/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { Role } from '../types/auth';

const LayananCardSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <SkeletonShimmer style={styles.iconBox} />
            <View style={styles.titleBox}>
                <SkeletonShimmer style={{ width: '80%', height: 14, marginBottom: 4 }} />
                <SkeletonShimmer style={{ width: '40%', height: 12 }} />
            </View>
        </View>
        <View style={styles.cardBody}>
            <SkeletonShimmer style={{ width: '100%', height: 12, marginBottom: 8 }} />
            <SkeletonShimmer style={{ width: '60%', height: 12 }} />
        </View>
    </View>
);

export default function LayananListScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { layanan, loading, fetchLayanan, hasMore, page, dinas, fetchDinas } = useLayananStore();
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDinasId, setSelectedDinasId] = useState<number | undefined>(route.params?.dinasId);
    const [debouncedQuery] = useDebounce(searchQuery, 500);

    useEffect(() => {
        fetchDinas({ size: 50 });
    }, []);

    useEffect(() => {
        const load = async () => {
             // Pass name and dinasId parameter
             await fetchLayanan({ page: 0, name: debouncedQuery, dinasId: selectedDinasId });
             if (isInitialLoad) setIsInitialLoad(false);
        };
        load();
    }, [debouncedQuery, selectedDinasId]);

    const onRefresh = async () => {
        setRefreshing(true);
         await fetchLayanan({ page: 0, name: debouncedQuery, dinasId: selectedDinasId });
         fetchDinas();
        setRefreshing(false);
    };

    const loadMore = async () => {
        if (!hasMore || loading || loadingMore) return;
        setLoadingMore(true);
        await fetchLayanan({ page: page + 1, name: debouncedQuery, isLoadMore: true, dinasId: selectedDinasId });
        setLoadingMore(false);
    };

    const showSkeleton = isInitialLoad && loading;

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('LayananDetail', { id: item.id, item })}
        >
            {item.urlGambar ? (
                <Image source={{ uri: getImageUrl(item.urlGambar) }} style={styles.cardImage} resizeMode="cover" />
            ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Icon name="briefcase" size={32} color="#CBD5E1" />
                </View>
            )}
            <View style={styles.cardContent}>
                <View style={[styles.badge, styles.badgeOnline]}>
                     <Icon name="globe-outline" size={10} color="#10B981" />
                    <Text style={[styles.badgeText, styles.textOnline]}>Online</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.nama}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.deskripsi}</Text>
                
                <View style={styles.cardFooter}>
                    <View style={styles.infoRow}>
                        <Icon name="time-outline" size={12} color="#64748B" />
                        <Text style={styles.infoText}>{item.estimasiWaktu || '-'} Menit</Text>
                    </View>
                    <View style={styles.infoRow}>
                       <Text style={styles.detailButton}>Detail</Text>
                       <Icon name="arrow-forward" size={12} color="#3B82F6" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daftar Layanan</Text>
                <View style={styles.headerBtn}>
                    <PermissionGuard allowedRoles={[Role.SUPERADMIN, Role.EXECUTIVE, Role.ADMIN]}>
                        <TouchableOpacity onPress={() => navigation.navigate('CreateLayanan')}>
                            <Icon name="add-circle" size={28} color="#3B82F6" />
                        </TouchableOpacity>
                    </PermissionGuard>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari layanan..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Dinas */}
                {user?.role !== Role.ADMIN && user?.role !== Role.STAFF && (
                    <View style={styles.filterWrapper}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.filterContent}
                        >
                            <TouchableOpacity 
                                style={[styles.filterChip, !selectedDinasId && styles.activeFilterChip]} 
                                onPress={() => setSelectedDinasId(undefined)}
                            >
                                <Text style={[styles.filterText, !selectedDinasId && styles.activeFilterText]}>Semua</Text>
                            </TouchableOpacity>
                            {dinas.map((d) => (
                                <TouchableOpacity 
                                    key={d.id} 
                                    style={[styles.filterChip, selectedDinasId === d.id && styles.activeFilterChip]}
                                    onPress={() => setSelectedDinasId(selectedDinasId === d.id ? undefined : d.id)}
                                >
                                    <Text style={[styles.filterText, selectedDinasId === d.id && styles.activeFilterText]}>{d.dinasKode}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {showSkeleton ? (
                <View style={styles.listContent}>
                   <LayananCardSkeleton />
                   <LayananCardSkeleton />
                   <LayananCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={layanan}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                     ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        !loading && layanan.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Icon name="briefcase-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>Belum ada layanan</Text>
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
        backgroundColor: '#FCFDFF',
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
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
        height: '100%',
        paddingVertical: 0, 
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#F8FAFC',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
        position: 'relative',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        marginTop: 4,
        lineHeight: 24,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    detailButton: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3B82F6',
    },
    badge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    badgeOnline: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    textOnline: {
        color: '#10B981',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyContainer: {
        paddingTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    titleBox: {
        flex: 1,
        justifyContent: 'center',
    },
    cardBody: {
        marginTop: 8,
    },
    filterWrapper: {
        marginTop: 12,
    },
    filterContent: {
        gap: 8,
        paddingRight: 16,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeFilterChip: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    filterText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#3B82F6',
        fontWeight: '600',
    }
});
