import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Animated,
    TextInput,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDebounce } from 'use-debounce';
import useEventStore from '../stores/eventStore';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';
import { getImageUrl } from '../config/api';

const { width } = Dimensions.get('window');

// Skeleton Shimmer Component
const SkeletonShimmer = ({ style }: { style?: any }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    backgroundColor: '#E2E8F0',
                },
                style,
                { opacity },
            ]}
        />
    );
};

// Skeleton Card Component
const EventCardSkeleton = () => (
    <View style={styles.eventCard}>
        <SkeletonShimmer style={styles.eventImage} />
        <View style={styles.eventDetails}>
            <View style={styles.categoryRow}>
                <SkeletonShimmer style={{ width: 80, height: 20 }} />
            </View>
            <SkeletonShimmer style={{ width: '90%', height: 18, marginBottom: 8 }} />
            <SkeletonShimmer style={{ width: '60%', height: 18, marginBottom: 12 }} />
            <View style={styles.infoRow}>
                <SkeletonShimmer style={{ width: 14, height: 14 }} />
                <SkeletonShimmer style={{ width: 150, height: 12, marginLeft: 8 }} />
            </View>
            <View style={styles.infoRow}>
                <SkeletonShimmer style={{ width: 14, height: 14 }} />
                <SkeletonShimmer style={{ width: 120, height: 12, marginLeft: 8 }} />
            </View>
        </View>
    </View>
);

export default function EventListScreen() {
    const navigation = useNavigation<any>();
    const { 
        events, 
        loading, 
        error, 
        hasMore,
        fetchEvents 
    } = useEventStore();

    const { user } = useAuthStore();
    const canCreate = user?.role === Role.SUPERADMIN || user?.role === Role.EXECUTIVE || user?.role === Role.ADMIN;
    
    // Local state
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 500);

    // Initial Fetch (and on debouncedQuery change)
    useEffect(() => {
        fetchEvents({ search: debouncedQuery });
    }, [debouncedQuery]);

    // Pull to Refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents({ page: 0, search: debouncedQuery });
        setRefreshing(false);
    };

    // Load More (Pagination)
    const loadMore = async () => {
        if (!hasMore || loading || loadingMore) return;
        
        setLoadingMore(true);
        // Calculate next page based on current list size / page size assumption or store page
        const currentPage = useEventStore.getState().page;
        await fetchEvents({ page: currentPage + 1, isLoadMore: true, search: debouncedQuery });
        setLoadingMore(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item: event }: { item: any }) => (
        <TouchableOpacity 
            style={styles.eventCard}
            onPress={() => navigation.navigate('EventDetail', { event })}
        >
            {(() => {
                const imagePath = event.urlGambar || (event as any).url_gambar || (event as any).foto;
                return imagePath ? (
                    <Image source={{ uri: getImageUrl(imagePath) }} style={styles.eventImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.eventImage, styles.placeholderImage]}>
                        <Icon name="calendar" size={40} color="#CBD5E1" />
                    </View>
                );
            })()}
            
            <View style={styles.eventDetails}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.judul}</Text>
                
                <View style={styles.infoRow}>
                    <Icon name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.infoText}>{formatDate(event.tanggalMulai)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Icon name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.infoText} numberOfLines={1}>{event.lokasi}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Show skeleton on initial load
    // const showSkeleton = isInitialLoad && loading; // Removed isInitialLoad

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agenda Kegiatan</Text>
                <View style={styles.headerBtn}>
                    {canCreate && (
                        <TouchableOpacity onPress={() => navigation.navigate('CreateEvent')}>
                            <Icon name="add-circle" size={28} color="#F59E0B" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

             {/* Search Bar */}
             <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari agenda..."
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
        </>
    );

    const showSkeleton = loading && !events.length && !refreshing;

    const renderEmpty = () => {
        if (loading || events.length > 0) return null;
        return (
            <View style={styles.emptyContainer}>
                <Icon name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>Belum ada agenda kegiatan</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {renderHeader()}

            {showSkeleton ? (
                <View style={styles.listContent}>
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                    <EventCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={events}
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
                    ListEmptyComponent={renderEmpty()}
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
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
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    eventCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        // Flat design refinement
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 12, 
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    eventImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#F8FAFC',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventDetails: {
        padding: 16,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500',
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: 'center',
    }
});
