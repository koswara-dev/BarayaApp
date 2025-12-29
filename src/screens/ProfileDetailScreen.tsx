import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-crop-picker';
import api, { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';

import useUserStore from '../stores/userStore';

export default function ProfileDetailScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);

    const {
        profile,
        loading,
        error,
        fetchUserProfile,
        uploadUserPhoto,
        changeUserPassword
    } = useUserStore();

    // Password Change State
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    useEffect(() => {
        if (user?.id) {
            fetchUserProfile(user.id);
        }
    }, [user?.id, fetchUserProfile]);

    // Handle store errors
    useEffect(() => {
        if (error) {
            showToast(error, 'error');
        }
    }, [error, showToast]);

    const handleImagePick = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 300,
                height: 300,
                cropping: true,
                mediaType: 'photo',
                includeBase64: false,
                compressImageQuality: 0.8,
            });

            if (image) {
                const userId = user?.id || 1;
                // Adapter for the store which expects { uri, type, fileName }
                const asset = {
                    uri: image.path,
                    type: image.mime,
                    fileName: image.filename || `avatar_${userId}.jpg`,
                };

                const success = await uploadUserPhoto(userId, asset);
                if (success) {
                    showToast('Foto profil berhasil diperbarui', 'success');
                }
            }
        } catch (error: any) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                Alert.alert('Error', error.message || 'Gagal memilih gambar');
            }
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            showToast('Konfirmasi password tidak cocok', 'error');
            return;
        }
        if (passwords.new.length < 6) {
            showToast('Password minimal 6 karakter', 'error');
            return;
        }

        const userId = user?.id || 1;
        const success = await changeUserPassword(userId, {
            current: passwords.current,
            new: passwords.new
        });

        if (success) {
            showToast('Password berhasil diubah', 'success');
            setPasswords({ current: '', new: '', confirm: '' });
            setShowPasswordChange(false);
        }
    };

    // Use profile from store or fallback to auth store user, then to empty state
    const userData = profile || {
        username: user?.username || '', // Fallback to authStore if available
        email: user?.email || '',
        phoneNumber: '',
        nik: '',
        fullName: user?.fullName || '',
        alamat: '',
        role: user?.role || '',
        urlFoto: (user as any)?.urlFoto || '',
        verified: (user as any)?.verified || false
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && !profile ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Avatar Section */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={getImageUrl(userData.urlFoto) ? { uri: getImageUrl(userData.urlFoto) } : { uri: 'https://via.placeholder.com/150' }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.editAvatarButton} onPress={handleImagePick} disabled={loading}>
                                <Icon name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{userData.fullName || 'User'}</Text>
                        <Text style={styles.userRole}>{userData.role || 'Role'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: userData.verified ? '#DCFCE7' : '#FEE2E2' }]}>
                            <Text style={[styles.statusText, { color: userData.verified ? '#166534' : '#991B1B' }]}>
                                {userData.verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                            </Text>
                        </View>
                        {!profile && (
                            <Text style={{ textAlign: 'center', marginTop: 8, color: '#f59e0b', fontSize: 12 }}>
                                (Data ditampilkan dari sesi lokal karena gagal memuat dari server)
                            </Text>
                        )}
                    </View>

                    {/* Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

                        <InfoItem label="Username" value={userData.username} icon="account" />
                        <InfoItem label="Email" value={userData.email} icon="email" />
                        <InfoItem label="Nomor Telepon" value={userData.phoneNumber} icon="phone" />
                        <InfoItem label="NIK" value={userData.nik} icon="card-account-details" />
                        <InfoItem label="Alamat" value={userData.alamat} icon="map-marker" />
                    </View>

                    {/* Password Section */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.passwordHeader}
                            onPress={() => setShowPasswordChange(!showPasswordChange)}
                        >
                            <Text style={styles.sectionTitle}>Keamanan</Text>
                            <Icon name={showPasswordChange ? "chevron-up" : "chevron-down"} size={24} color="#64748B" />
                        </TouchableOpacity>

                        {showPasswordChange && (
                            <View style={styles.passwordForm}>
                                <InputPassword
                                    label="Password Sekarang"
                                    value={passwords.current}
                                    onChangeText={(t: string) => setPasswords({ ...passwords, current: t })}
                                />
                                <InputPassword
                                    label="Password Baru"
                                    value={passwords.new}
                                    onChangeText={(t: string) => setPasswords({ ...passwords, new: t })}
                                />
                                <InputPassword
                                    label="Konfirmasi Password"
                                    value={passwords.confirm}
                                    onChangeText={(t: string) => setPasswords({ ...passwords, confirm: t })}
                                />

                                <TouchableOpacity
                                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                                    onPress={handleChangePassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Simpan Password</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

// Sub-components for cleaner code
const InfoItem = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIconContainer}>
            <Icon name={icon} size={20} color="#64748B" />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '-'}</Text>
        </View>
    </View>
);

const InputPassword = ({ label, value, onChangeText }: any) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry
            placeholder={`Masukkan ${label.toLowerCase()}`}
            placeholderTextColor="#94A3B8"
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#F1F5F9',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    passwordForm: {
        marginTop: 10,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#0F172A',
    },
    saveButton: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
