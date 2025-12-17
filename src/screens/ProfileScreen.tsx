import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Modal, TouchableOpacity } from 'react-native';
import { ProfileHeader } from '../components/ProfileHeader';
import { MenuSection } from '../components/MenuSection';
import { LogoutButton } from '../components/LogoutButton';
import { menuSection1, menuSection2 } from '../data/profileData';
import useAuthStore from '../stores/authStore';
import api from '../config/api';
import useToastStore from '../stores/toastStore';
import useAuthActions from '../hooks/useAuthActions';
import { ConfirmModal } from '../components/ConfirmModal';

export default function ProfileScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const showToast = useToastStore((state) => state.showToast);
    const { logout } = useAuthActions();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const res = await api.get(`/users/${user.id}`);
            if (res.data.success) {
                setProfile(res.data.data);
            }
        } catch (error) {
            console.log("Failed to fetch profile", error);
            showToast("Gagal memuat profil", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, showToast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const handleMenuPress = (id: string) => {
        switch (id) {
            case '1':
                showToast("Fitur Riwayat belum tersedia", "info");
                break;
            case '2':
                showToast("Fitur Dokumen belum tersedia", "info");
                break;
            case '3':
                showToast("Fitur Pengaturan belum tersedia", "info");
                break;
            case '4':
                showToast("Fitur Bantuan belum tersedia", "info");
                break;
            case '5':
                showToast("Fitur Tentang belum tersedia", "info");
                break;
        }
    };

    const handleProfilePress = () => {
        showToast("Edit profil belum tersedia", "info");
    };

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = () => {
        setLogoutModalVisible(false);
        logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
        showToast("Berhasil keluar", "success");
    };

    const displayUser = profile ? {
        name: profile.fullName || "User",
        email: profile.email || "email@example.com",
        avatar: profile.urlFoto || "",
        role: profile.role || "User"
    } : {
        name: user?.fullName || "Loading...",
        email: user?.email || "...",
        avatar: "",
        role: user?.role || ""
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Akun Pengguna</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <ProfileHeader user={displayUser} onPress={handleProfilePress} />

                <MenuSection items={menuSection1} onItemPress={handleMenuPress} />

                <MenuSection items={menuSection2} onItemPress={handleMenuPress} />

                <LogoutButton onPress={handleLogout} />

                <Text style={styles.version}>Versi Aplikasi 1.0.0</Text>
            </ScrollView>

            {/* Reusable Confirm Modal */}
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
        backgroundColor: '#F1F5F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        // backgroundColor: "#FFF",
        // elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: 'center',
        flex: 1,
        marginLeft: 40
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    version: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 24,
    },

});