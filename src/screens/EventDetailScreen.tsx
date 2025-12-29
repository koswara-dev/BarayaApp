import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Dimensions, Animated, Linking, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Event } from '../types/event';
import useEventStore from '../stores/eventStore';
import api, { getImageUrl } from '../config/api';

const { width } = Dimensions.get('window');

// Helper: Format Date
const formatDateFull = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    });
};

export default function EventDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { event } = route.params || {};
    
    // Local state for fetched event if params only provided ID
    const [fetchedEvent, setFetchedEvent] = React.useState<Event | null>(null);
    const [loading, setLoading] = React.useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const loadEvent = async () => {
             // If we already have a full event object (check a required field like judul), use it
             if (event && event.judul) {
                 return; 
             }
             
             // If we only have ID (e.g. event.id), try to find in store or fetch
             const eventId = event?.id;
             if (!eventId) return;

             setLoading(true);
             try {
                // Try store first
                const storeEvent = useEventStore.getState().events.find(e => String(e.id) === String(eventId));
                if (storeEvent) {
                    setFetchedEvent(storeEvent);
                } else {
                    // Fetch API
                     const res = await api.get(`/event/${eventId}`);
                     if (res.data.success) {
                         setFetchedEvent(res.data.data);
                     }
                }
             } catch (err) {
                 console.log('Failed to load event detail', err);
             } finally {
                 setLoading(false);
             }
        };
        
        loadEvent();
    }, [event]);

    const eventItem: Event = fetchedEvent || event;

    if (loading) {
         return (
            <View style={[styles.container, styles.errorContainer]}>
                <ActivityIndicator size="large" color="#0F172A" />
            </View>
         );
    }

    if (!eventItem || !eventItem.judul) return (
        <View style={styles.errorContainer}>
            <Text>Data event tidak ditemukan</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                 <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
        </View>
    );

    // Header Animation
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const handleShare = () => {
        // Implement share logic (e.g., React Native Share)
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Float Header */}
            <Animated.View style={[styles.headerFloat, { opacity: headerOpacity }]}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{eventItem.judul}</Text>
                </View>
            </Animated.View>

            {/* Header Controls (Always Visible) */}
            <View style={styles.headerControls}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.circleBtn}>
                    <Icon name="share-social" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image 
                        source={{ uri: getImageUrl(eventItem.urlGambar || '') }} 
                        style={styles.heroImage} 
                        resizeMode="cover" 
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroTextContainer}>
                        <View style={styles.dinasBadge}>
                            <Text style={styles.dinasText}>{eventItem.dinasNama}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{eventItem.judul}</Text>
                    </View>
                </View>

                {/* Content Body */}
                <View style={styles.body}>
                    {/* Time & Location Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBox}>
                                <Icon name="calendar" size={20} color="#3B82F6" />
                            </View>
                            <View style={styles.infoTextCol}>
                                <Text style={styles.infoLabel}>Tanggal</Text>
                                <Text style={styles.infoValue}>{formatDateFull(eventItem.tanggalMulai)}</Text>
                                <Text style={styles.infoSubValue}>
                                    {formatTime(eventItem.tanggalMulai)} - {formatTime(eventItem.tanggalSelesai)} WIB
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBox}>
                                <Icon name="location" size={20} color="#EF4444" />
                            </View>
                            <View style={styles.infoTextCol}>
                                <Text style={styles.infoLabel}>Lokasi</Text>
                                <Text style={styles.infoValue}>{eventItem.lokasi}</Text>
                                {eventItem.latitude && eventItem.longitude && (
                                    <TouchableOpacity 
                                        onPress={() => Linking.openURL(`https://maps.google.com/?q=${eventItem.latitude},${eventItem.longitude}`)}
                                    >
                                        <Text style={styles.mapLink}>Buka di peta</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Deskripsi Event</Text>
                        <Text style={styles.descText}>{eventItem.deskripsi}</Text>
                    </View>

                </View>
                <View style={{height: 100}} />
            </ScrollView>

            {/* Bottom Join Button (Optional) */}
            {/* <View style={styles.footer}>
                <TouchableOpacity style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Daftar Kehadiran</Text>
                </TouchableOpacity>
            </View> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#0F172A',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: '700',
    },
    headerFloat: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 90, // Include status bar height
        backgroundColor: '#FFFFFF',
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingTop: 40, // Status bar offset
        justifyContent: 'center',
        elevation: 4,
    },
    headerContent: {
        paddingHorizontal: 60, // Space for buttons
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerControls: {
        position: 'absolute',
        top: 40, // Status bar offset
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 20,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heroContainer: {
        height: 350,
        position: 'relative',
        backgroundColor: '#1E293B',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        // Gradient effect could be added here
    },
    heroTextContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
    },
    dinasBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    dinasText: {
        color: '#0F172A',
        fontWeight: '800',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 32,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    body: {
        marginTop: -24,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingTop: 32,
    },
    infoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    infoTextCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '700',
        marginBottom: 2,
    },
    infoSubValue: {
        fontSize: 13,
        color: '#64748B',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
    mapLink: {
        color: '#3B82F6',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 16,
    },
    descText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 28,
        textAlign: 'justify',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    joinBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    joinBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    }
});
