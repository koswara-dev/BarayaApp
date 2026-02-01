import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import useNotificationStore, { NotificationItem } from '../stores/notificationStore';
import useAuthStore from '../stores/authStore';
import { Role } from '../types/auth';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Helper: Format Date for Section Headers
const getSectionTitle = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Reset time for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - target.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays === 0) return 'HARI INI';
    if (diffDays === 1) return 'KEMARIN';

    if (diffDays < 7) {
        return DAYS[date.getDay()].toUpperCase();
    }

    return `${date.getDate()} ${MONTHS[date.getMonth()].toUpperCase()} ${date.getFullYear()}`;
};

// Helper: Format Time for Items (e.g., 10:30, 2 jam lalu)
const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} mnt`;

    // Always return HH:mm for everything else (Today, Yesterday, Older)
    // Date context is provided by the Section Header
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export default function NotificationScreen({ navigation }: any) {
    const { 
        notifications, 
        loading, 
        fetchNotifications, 
        markAsRead, 
        loadMoreNotifications, 
        loadingMore, 
        hasMore 
    } = useNotificationStore();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Semua');

    useEffect(() => {
        const userId = user?.role === Role.USER ? user?.id : undefined;
        fetchNotifications(false, undefined, user?.camatId, false, userId);
        // Polling is now handled globally in RootNavigator to ensure push notifications work on all screens
    }, []);

    const handleLoadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            loadMoreNotifications();
        }
    };

    // Group Notifications logic
    const sections = React.useMemo(() => {
        if (!notifications || notifications.length === 0) return [];

        let filteredList = [...notifications];
        
        // Filter for USER role: Only show EVENT and BERITA (News)
        if (user?.role === Role.USER) {
            filteredList = filteredList.filter(item => {
                const cat = (item.category || '').toUpperCase();
                return cat === 'EVENT' || cat === 'BERITA' || cat === 'SAMSAT' || cat === 'PENGADUAN';
            });
        }

        const sortedNotifications = filteredList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        const grouped: { [key: string]: any[] } = {};

        sortedNotifications.forEach((item: NotificationItem) => {
            // item.createdAt expected from API, fallback to now if missing
            const dateStr = item.createdAt || new Date().toISOString();
            const sectionKey = getSectionTitle(dateStr);

            if (!grouped[sectionKey]) {
                grouped[sectionKey] = [];
            }

            // Map API fields to UI fields
            // API: id, judul, pesan, createdAt, isRead?
            // UI: id, icon, iconColor, title, time, desc, unread

            let icon = 'megaphone';
            let iconColor = '#3B82F6'; // Default Blue

            // Simple logic to determine icon based on title/type
            const titleLower = (item.judul || '').toLowerCase();
            const category = item.category || '';

            if (category === 'SAMSAT') {
                icon = 'car';
                iconColor = '#10B981'; // Green for official/service
            } else if (category === 'BERITA') {
                icon = 'newspaper';
                iconColor = '#3B82F6'; // Blue
            } else if (category === 'EVENT' || titleLower.includes('layanan baru') || titleLower.includes('agenda')) {
                icon = 'calendar'; // Changed to calendar for Event
                iconColor = '#8B5CF6'; // Purple
            } else if (titleLower.includes('darurat') || titleLower.includes('peringatan') || titleLower.includes('bencana') || category === 'DARURAT') {
                icon = 'warning';
                iconColor = '#EF4444'; // Red
            } else if (titleLower.includes('tagihan') || titleLower.includes('pembayaran')) {
                icon = 'cash';
                iconColor = '#10B981'; // Green
            } else if (titleLower.includes('listrik') || titleLower.includes('pln')) {
                icon = 'flash';
                iconColor = '#F59E0B'; // Amber
            } else if (titleLower.includes('pengaduan') || titleLower.includes('laporan') || titleLower.includes('aduan')) {
                icon = 'megaphone';
                iconColor = '#F59E0B'; // Amber matching the yellow theme
            } else if (titleLower.includes('update') || titleLower.includes('aplikasi')) {
                icon = 'refresh';
                iconColor = '#64748B';
            }

            grouped[sectionKey].push({
                id: item.id,
                title: item.judul || 'Notifikasi',
                desc: item.pesan || '',
                time: formatTime(dateStr),
                icon,
                iconColor,
                unread: !item.read, // Assuming API has isRead, or default false
                category: item.category,
                referenceId: item.referenceId
            });
        });

        // Convert grouped object to array
        // We want specific order: Hari Ini, Kemarin, then Dates descending?
        // The loop order depends on input. Assuming input is sorted DESC by date.

        return Object.keys(grouped).map(key => ({
            title: key,
            data: grouped[key]
        }));

    }, [notifications]);

    const itemsToRender = activeTab === 'Semua'
        ? sections
        : sections; // Implement filter logic here if needed later

    const tabs = [
        { id: 'Semua', label: 'SEMUA', count: notifications.length || 0 },
        { id: 'Belum Dibaca', label: 'BELUM DIBACA', count: 0 }, // TODO: Filter unread count
        { id: 'Penting', label: 'PENTING', count: null },
    ];

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.itemContainer, item.unread && styles.itemUnread]}
            onPress={() => {
                if (item.unread) {
                    markAsRead(item.id);
                }

                if (item.category === 'PENGADUAN' && item.referenceId) {
                    navigation.navigate('AdminPengaduanDetail', { id: item.referenceId });
                } else {
                    navigation.navigate('NotificationDetail', { id: item.id });
                }
            }}
        >
            <View style={styles.iconBox}>
                <Icon name={item.icon} size={24} color={item.iconColor} />
                {item.unread && <View style={styles.unreadDotIcon} />}
            </View>
            <View style={styles.textContainer}>
                <View style={styles.topRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={[styles.itemTime, item.unread && styles.itemTimeUnread]}>{item.time}</Text>
                </View>
                <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.desc}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }: any) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
            <View style={styles.sectionLine} />
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 20 }} />;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color="#94A3B8" />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifikasi</Text>
                </View>
                <TouchableOpacity onPress={() => {
                    const userId = user?.role === Role.USER ? user?.id : undefined;
                    fetchNotifications(false, undefined, user?.camatId, false, userId);
                }}>
                    <MaterialIcon name="refresh" size={24} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* ... Tabs ... */}

            {/* List */}
            {loading && sections.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#FFC107" />
                </View>
            ) : (
                <SectionList
                    sections={itemsToRender}
                    keyExtractor={(item, index) => item.id.toString() + index}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={() => {
                        const userId = user?.role === Role.USER ? user?.id : undefined;
                        fetchNotifications(false, undefined, user?.camatId, false, userId);
                    }}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Icon name="notifications-off-outline" size={48} color="#CBD5E1" />
                            <Text style={{ marginTop: 12, color: '#94A3B8' }}>Belum ada notifikasi</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
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
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },

    // Tabs
    tabsWrapper: {
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    tabsContainer: {
        paddingHorizontal: 16,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4, // More boxy as per design
        borderWidth: 1,
        marginRight: 12,
    },
    activeTab: {
        backgroundColor: '#FFC107',
        borderColor: '#FFC107',
    },
    inactiveTab: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    activeTabText: {
        color: '#0F172A',
    },
    inactiveTabText: {
        color: '#64748B',
    },
    badge: {
        marginLeft: 8,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 10,
    },
    activeBadge: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    inactiveBadge: {
        backgroundColor: '#FEE2E2',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    activeBadgeText: {
        color: '#0F172A',
    },
    inactiveBadgeText: {
        color: '#EF4444',
    },

    // List
    listContent: {
        paddingBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 12,
        backgroundColor: '#FAFAFA', // Slight BG distinction
    },
    sectionHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        marginRight: 12,
        letterSpacing: 1,
    },
    sectionLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },

    // Item
    itemContainer: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    itemUnread: {
        backgroundColor: '#FFFCF1', // Very subtle yellow tint
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 8, // Square-ish
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        position: 'relative'
    },
    unreadDotIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444', // Or yellow per design, keeping red for high vis
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    textContainer: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
    },
    itemTime: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
    },
    itemTimeUnread: {
        color: '#FBbf24', // Yellowish for "Baru saja"
    },
    itemDesc: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
});
