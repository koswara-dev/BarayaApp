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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useEventStore from '../stores/eventStore';
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
    const { events, loading, fetchEvents, hasMore, page } = useEventStore();
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            await fetchEvents({ page: 0 });
            setIsInitialLoad(false);
        };
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchEvents({ page: 0 });
        setRefreshing(false);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            fetchEvents({ page: page + 1, isLoadMore: true });
        }
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

    // Show skeleton on initial load
    const showSkeleton = isInitialLoad && loading;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agenda Kegiatan</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
                }
                onMomentumScrollEnd={(e) => {
                    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                    if (isCloseToBottom) handleLoadMore();
                }}
            >
                {showSkeleton ? (
                    <View style={styles.eventList}>
                        {[1, 2, 3].map((_, index) => (
                            <EventCardSkeleton key={index} />
                        ))}
                    </View>
                ) : events.length === 0 && !loading ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="calendar-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Belum ada agenda kegiatan</Text>
                    </View>
                ) : (
                    <View style={styles.eventList}>
                        {events.map((event) => (
                            <TouchableOpacity key={event.id} style={styles.eventCard}>
                                {(() => {
                                    const imagePath = event.urlGambar || (event as any).url_gambar || (event as any).foto;
                                    return imagePath ? (
                                        <Image source={{ uri: getImageUrl(imagePath) }} style={styles.eventImage} resizeMode="cover" />
                                    ) : (
                                        <View style={[styles.eventImage, styles.placeholderImage]}>
                                            <Icon name="image-outline" size={40} color="#CBD5E1" />
                                        </View>
                                    );
                                })()}
                                <View style={styles.eventDetails}>
                                    <View style={styles.categoryRow}>
                                        <View style={styles.dinasBadge}>
                                            <Text style={styles.dinasText}>{event.dinasNama}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.eventTitle} numberOfLines={2}>{event.judul}</Text>

                                    <View style={styles.infoRow}>
                                        <Icon name="time-outline" size={14} color="#64748B" />
                                        <Text style={styles.infoText}>{formatDate(event.tanggalMulai)}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Icon name="location-outline" size={14} color="#64748B" />
                                        <Text style={styles.infoText} numberOfLines={1}>{event.lokasi}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {loading && !isInitialLoad && (
                    <View style={styles.loadingFooter}>
                        <ActivityIndicator color="#F59E0B" />
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
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
    content: {
        flex: 1,
    },
    eventList: {
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0, // Flat design as requested previously for other screens
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
    dinasBadge: {
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    dinasText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#F59E0B',
        textTransform: 'uppercase',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 12,
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
        marginTop: 16,
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    loadingFooter: {
        paddingVertical: 20,
    }
});
