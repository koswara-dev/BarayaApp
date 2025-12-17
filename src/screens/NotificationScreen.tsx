import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useNotificationStore from '../stores/notificationStore';
import { NotificationList } from '../components/NotificationList';

export default function NotificationScreen({ navigation }: any) {
    const { notifications, loading, fetchNotifications } = useNotificationStore();
    const [activeTab, setActiveTab] = useState('Semua');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handlePress = (item: any) => {
        // Handle nav
    };

    const tabs = [
        { id: 'Semua', label: 'Semua', count: 5 },
        { id: 'Terbaru', label: 'Terbaru' },
        { id: 'Dibaca', label: 'Dibaca' },
        { id: 'Penting', label: 'Penting' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Notifikasi</Text>
                </View>

                {/* Dummy view for balancing */}
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                            onPress={() => setActiveTab(tab.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                            {tab.count && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{tab.count}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" />
                ) : (
                    <NotificationList
                        data={notifications}
                        onItemPress={handlePress}
                    />
                )}
            </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    /* Tabs */
    tabsContainer: {
        paddingBottom: 8,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activeTab: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
});
