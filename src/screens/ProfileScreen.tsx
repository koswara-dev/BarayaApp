import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Modal, TouchableOpacity, Image, StatusBar, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useUserStore from '../stores/userStore';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../stores/authStore';
import api, { getImageUrl } from '../config/api';
import useToastStore from '../stores/toastStore';
import useAuthActions from '../hooks/useAuthActions';
import { ConfirmModal } from '../components/ConfirmModal';
import GetLocation from 'react-native-get-location';

export default function ProfileScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);
    const { logout } = useAuthActions();

    const { profile, loading, fetchUserProfile } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
    const [currentCity, setCurrentCity] = useState('Mencari...');

    const fetchCurrentLocation = async () => {
        try {
            const location = await GetLocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
            });

            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`);
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Lokasi Aktif';
            setCurrentCity(city.toUpperCase());
        } catch (error) {
            console.log('Location error:', error);
            setCurrentCity('INDONESIA');
        }
    };

    const loadData = useCallback(async () => {
        if (user?.id) {
            await fetchUserProfile(user.id);
        }
        await fetchCurrentLocation();
    }, [user?.id, fetchUserProfile]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = () => {
        setLogoutModalVisible(false);
        logout();
        showToast("Sesi Anda telah diakhiri", "success");
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil Saya</Text>
                <TouchableOpacity onPress={() => showToast("Pengaturan segera hadir", "info")} style={styles.headerBtn}>
                    <Icon name="settings-sharp" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Profile Top Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarOutline}>
                            <View style={styles.avatarInner}>
                                {profile?.urlFoto ? (
                                    <Image source={{ uri: getImageUrl(profile.urlFoto) }} style={styles.avatarImg} />
                                ) : (
                                    <Icon name="person" size={50} color="#CBD5E1" />
                                )}
                            </View>
                            <TouchableOpacity style={styles.cameraBtn} onPress={() => navigation.navigate('ProfileDetail')}>
                                <Icon name="camera" size={16} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.userName}>{profile?.fullName || user?.fullName || "User"}</Text>
                    <Text style={styles.userNik}>NIK: {profile?.nik || "3208092801900001"}</Text>

                    <View style={styles.badgeRow}>
                        <View style={styles.verifiedBadge}>
                            <Icon name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.verifiedText}>TERVERIFIKASI</Text>
                        </View>
                        <View style={styles.locationBadge}>
                            <Icon name="location-sharp" size={14} color="#3B82F6" />
                            <Text style={styles.locationText}>{currentCity}</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Section 1 */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>AKTIVITAS SAYA</Text>
                </View>
                <View style={styles.menuBox}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ServiceHistory')}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Icon name="document-text" size={20} color="#3B82F6" />
                        </View>
                        <View style={styles.menuTextBox}>
                            <Text style={styles.menuTitle}>Riwayat Layanan</Text>
                            <Text style={styles.menuSubtitle}>Pantau status permohonan Anda</Text>
                        </View>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ComplaintHistory')}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Icon name="chatbox-ellipses" size={20} color="#F97316" />
                        </View>
                        <View style={styles.menuTextBox}>
                            <Text style={styles.menuTitle}>Riwayat Pengaduan</Text>
                            <Text style={styles.menuSubtitle}>Lihat tindak lanjut laporan</Text>
                        </View>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Menu Section 2 */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>PENGATURAN AKUN</Text>
                </View>
                <View style={styles.menuBox}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileDetail')}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                            <Icon name="person-sharp" size={20} color="#64748B" />
                        </View>
                        <Text style={styles.menuTitleOnly}>Informasi Pribadi</Text>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => showToast("Dokumen Digital segera hadir", "info")}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                            <Icon name="folder-open" size={20} color="#64748B" />
                        </View>
                        <Text style={styles.menuTitleOnly}>Dokumen Digital</Text>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => showToast("Keamanan segera hadir", "info")}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                            <Icon name="shield-checkmark" size={20} color="#64748B" />
                        </View>
                        <Text style={styles.menuTitleOnly}>Keamanan & Kata Sandi</Text>
                        <Icon name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View style={styles.logoutWrapper}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <View style={styles.logoutIconBox}>
                            <Icon name="log-out-outline" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.logoutText}>Keluar Aplikasi</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.versionText}>Versi Aplikasi 2.4.1 (Build 2024)</Text>

                <View style={{ height: 40 }} />
            </ScrollView>

            <ConfirmModal
                visible={isLogoutModalVisible}
                title="Keluar Aplikasi"
                message="Apakah Anda yakin ingin keluar dari akun Anda?"
                onConfirm={confirmLogout}
                onCancel={() => setLogoutModalVisible(false)}
                confirmText="Ya, Keluar"
                cancelText="Batal"
                type="danger"
            />
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
        paddingBottom: 20,
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
    scrollView: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFFBEB',
    },
    avatarContainer: {
        marginBottom: 20,
    },
    avatarOutline: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        position: 'relative',
    },
    avatarInner: {
        width: 104,
        height: 104,
        borderRadius: 52,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#FFB800',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 6,
    },
    userNik: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        gap: 6,
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#065F46',
        letterSpacing: 0.5,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        gap: 6,
    },
    locationText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E40AF',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#FFF',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    menuBox: {
        backgroundColor: '#FFF',
        borderBottomWidth: 6,
        borderBottomColor: '#F8FAFC',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuTextBox: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    menuTitleOnly: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    logoutWrapper: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    logoutIconBox: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#EF4444',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#CBD5E1',
        fontWeight: '700',
        marginTop: 30,
        marginBottom: 20,
        letterSpacing: 0.5,
    },
});