import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export const NotificationItem = ({ item, onPress }: any) => {
    // Helper to determine type based on title keywords
    const getType = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('selesai') || lower.includes('berhasil') || lower.includes('diterima')) return 'success';
        if (lower.includes('jatuh tempo') || lower.includes('gagal') || lower.includes('peringatan')) return 'warning';
        if (lower.includes('sim') || lower.includes('layanan')) return 'primary';
        return 'info';
    };

    const type = getType(item.judul || '');

    // Styles config based on type
    const getStyles = (t: string) => {
        switch (t) {
            case 'success':
                return { icon: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' };
            case 'warning':
                return { icon: 'warning', color: '#F59E0B', bg: '#FFFBEB' };
            case 'primary':
                return { icon: 'megaphone', color: '#3B82F6', bg: '#EFF6FF' };
            default:
                return { icon: 'information-circle', color: '#64748B', bg: '#F1F5F9' };
        }
    };

    const styleConfig = getStyles(type);

    // Simple relative time format
    const getTimeDisplay = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 1) return { text: 'Baru saja', isRecent: true };
        if (diffHours < 24) return { text: `${Math.floor(diffHours)} jam yang lalu`, isRecent: false };

        // Otherwise return time HH:mm
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return { text: `${hours}:${minutes}`, isRecent: false };
    };

    const timeInfo = getTimeDisplay(item.createdAt);

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: styleConfig.bg }]}>
                <Icon name={styleConfig.icon} size={24} color={styleConfig.color} />
            </View>

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{item.judul}</Text>

                    {timeInfo.isRecent ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{timeInfo.text}</Text>
                        </View>
                    ) : (
                        <Text style={styles.timeText}>{timeInfo.text}</Text>
                    )}
                </View>

                <Text style={styles.message} numberOfLines={3}>
                    {item.pesan}
                </Text>
            </View>

            {!item.read && <View style={styles.dot} />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#F1F5F9', // Subtle border
        // Elevation/Shadow
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        marginRight: 8,
    },
    message: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    /* Time Styles */
    timeText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    badge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2563EB',
    },
    /* Unread Dot */
    dot: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    }
});
