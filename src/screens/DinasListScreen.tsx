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
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDebounce } from 'use-debounce';
import useLayananStore from '../stores/layananStore';
import SkeletonShimmer from '../components/SkeletonShimmer';
import { getImageUrl } from '../config/api';

// Skeleton Card for Dinas
const DinasCardSkeleton = () => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <SkeletonShimmer style={styles.iconBox} />
            <View style={styles.titleBox}>
                <SkeletonShimmer style={{ width: '80%', height: 14, marginBottom: 4 }} />
                <SkeletonShimmer style={{ width: '50%', height: 12 }} />
            </View>
        </View>
        <View style={styles.cardBody}>
            <View style={styles.infoRow}>
                <SkeletonShimmer style={{ width: 14, height: 14 }} />
                <SkeletonShimmer style={{ width: '70%', height: 12, marginLeft: 8 }} />
            </View>
            <View style={styles.infoRow}>
                <SkeletonShimmer style={{ width: 14, height: 14 }} />
                <SkeletonShimmer style={{ width: '50%', height: 12, marginLeft: 8 }} />
            </View>
        </View>
    </View>
);

import { PermissionGuard } from '../components/PermissionGuard';
import { Role } from '../types/auth';
import useDinasStore from '../stores/dinasStore';

export default function DinasListScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const isComplaint = route.params?.isComplaint;
    
    const { dinasList, loading, fetchDinas, hasMore, page } = useDinasStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 500);

    useEffect(() => {
        const loadData = async () => {
            await fetchDinas(0, 10, debouncedQuery);
            if (isInitialLoad) setIsInitialLoad(false);
        };
        loadData();
    }, [debouncedQuery]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDinas(0, 10, debouncedQuery);
        setRefreshing(false);
    };

    const loadMore = async () => {
        if (!hasMore || loading || loadingMore) return;
        setLoadingMore(true);
        await fetchDinas(page + 1, 10, debouncedQuery, true);
        setLoadingMore(false);
    };

    const showSkeleton = isInitialLoad && loading;

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('DinasDetail', { id: item.id, item })}
        >
            {item.urlFotoGedung ? (
                <Image source={{ uri: getImageUrl(item.urlFotoGedung) }} style={styles.cardImage} resizeMode="cover" />
            ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Icon name="business" size={40} color="#CBD5E1" />
                </View>
            )}
            <View style={styles.cardContent}>
                 <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.jenis}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.nama}</Text>
                <Text style={styles.cardAddress} numberOfLines={2}>{item.alamat}</Text>
               <TouchableOpacity style={styles.detailButton}>
                    <Text style={styles.detailButtonText}>Lihat Detail</Text>
                    <Icon name="arrow-forward" size={16} color="#3B82F6" />
               </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isComplaint ? 'Silakan Pilih Dinas/SKPD' : 'Daftar Dinas'}
                </Text>
                <View style={styles.headerBtn}>
                    <PermissionGuard allowedRoles={[Role.SUPERADMIN, Role.EXECUTIVE]}>
                        <TouchableOpacity onPress={() => navigation.navigate('CreateDinas')}>
                            <Icon name="add-circle" size={28} color="#F59E0B" />
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
                        placeholder="Cari dinas..."
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
            </View>

            {showSkeleton ? (
                <View style={styles.listContent}>
                   <DinasCardSkeleton />
                   <DinasCardSkeleton />
                   <DinasCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={dinasList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color="#F59E0B" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        !loading && dinasList.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Icon name="business-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>Data dinas tidak ditemukan</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
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
        paddingTop: 16,
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
        height: 160,
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
    badge: {
        position: 'absolute',
        top: -12,
        left: 16,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D97706',
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        marginTop: 8,
        lineHeight: 24,
    },
    cardAddress: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
        lineHeight: 20,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    detailButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        marginRight: 4,
    },
    // Keep these for skeleton usage if needed
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    titleBox: {
        flex: 1,
        justifyContent: 'center',
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 8,
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
    }
});
