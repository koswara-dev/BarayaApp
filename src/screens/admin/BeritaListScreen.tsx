import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import useBeritaStore, { Berita } from '../../stores/beritaStore';
import { getImageUrl } from '../../config/api';
import SkeletonShimmer from '../../components/SkeletonShimmer';

// Skeleton Component
const BeritaSkeleton = () => (
    <View style={styles.card}>
        <SkeletonShimmer style={styles.skeletonImage} />
        <View style={styles.cardContent}>
            <SkeletonShimmer style={{ width: '60%', height: 12, marginBottom: 8 }} />
            <SkeletonShimmer style={{ width: '100%', height: 16, marginBottom: 6 }} />
            <SkeletonShimmer style={{ width: '90%', height: 16, marginBottom: 12 }} />
            <SkeletonShimmer style={{ width: 80, height: 10 }} />
        </View>
    </View>
);

export default function AdminBeritaListScreen() {
    const navigation = useNavigation<any>();
    const { list, loading, fetchBerita, hasMore, page } = useBeritaStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadInitialData();
        }, [])
    );

    const loadInitialData = async () => {
        setIsInitialLoad(true);
        await fetchBerita({ page: 0 });
        setIsInitialLoad(false);
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchBerita({ page: 0 });
        setIsRefreshing(false);
    };

    const onLoadMore = () => {
        if (hasMore && !loading) {
            fetchBerita({ page: page + 1, isLoadMore: true });
        }
    };

    const renderItem = ({ item }: { item: Berita }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AdminBeritaDetail', { item })}
        >
            <Image
                source={item.urlGambar ? { uri: getImageUrl(item.urlGambar) } : { uri: 'https://placehold.co/600x400/png?text=No+Image' }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <View style={styles.dateRow}>
                    <Icon name="calendar-outline" size={12} color="#94A3B8" />
                    <Text style={styles.dateText}>
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                             day: 'numeric', month: 'long', year: 'numeric'
                        })}
                    </Text>
                    {item.dinasNama && (
                        <>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Text style={styles.dinasText} numberOfLines={1}>{item.dinasNama}</Text>
                        </>
                    )}
                </View>
                
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.judul}
                </Text>
                
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.deskripsi}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Berita</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && isInitialLoad ? (
                <View style={styles.listContent}>
                    {[1, 2, 3].map((_, i) => <BeritaSkeleton key={i} />)}
                </View>
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#FFB800']} />
                    }
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loading && !isInitialLoad ? <ActivityIndicator size="small" color="#FFB800" style={{ margin: 20 }} /> : null
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Icon name="newspaper-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>Belum ada berita</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateBerita')}
            >
                <Icon name="add" size={24} color="#FFF" />
            </TouchableOpacity>
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
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#F1F5F9',
    },
    skeletonImage: {
        width: '100%',
        height: 160,
    },
    cardContent: {
        padding: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 4,
    },
    dotSeparator: {
        marginHorizontal: 8,
        color: '#CBD5E1',
    },
    dinasText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 6,
        lineHeight: 22,
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
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
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFB800',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#FFB800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
});
