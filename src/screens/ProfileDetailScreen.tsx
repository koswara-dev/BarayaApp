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
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
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
    } = useUserStore();

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
                const asset = {
                    uri: image.path,
                    type: image.mime,
                    fileName: image.filename || `avatar_${userId}.jpg`,
                };

                const success = await uploadUserPhoto(userId, asset);
                if (success) {
                    showToast('Foto profil telah berhasil diperbarui', 'success');
                }
            }
        } catch (error: any) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                showToast(error.message || 'Gagal memilih gambar', 'error');
            }
        }
    };

    const userData = profile || {
        fullName: user?.fullName || 'Ahmad Zulkifli',
        nik: '3208092801900001',
        phoneNumber: '0812-3456-7890',
        email: user?.email || 'ahmad.zul@gmail.com',
        alamat: 'Dusun Manis, RT 001 RW 001, Desa Sangkanurip, Kec. Cigandamekar, Kab. Kuningan, Jawa Barat',
        urlFoto: '',
        verified: true,
        tempatLahir: 'Kuningan',
        tanggalLahir: '28 Januari 1990',
        jenisKelamin: 'Laki-laki'
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Informasi Pribadi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarOutline}>
                            <View style={styles.avatarInner}>
                                {userData.urlFoto ? (
                                    <Image source={{ uri: getImageUrl(userData.urlFoto) }} style={styles.avatarImg} />
                                ) : (
                                    <Icon name="person" size={70} color="#CBD5E1" />
                                )}
                            </View>
                            <TouchableOpacity style={styles.editAvatarBtn} onPress={handleImagePick}>
                                <Icon name="pencil" size={16} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.avatarHint}>Ketuk untuk ubah foto</Text>
                </View>

                {/* Section: IDENTITAS DIRI */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>IDENTITAS DIRI</Text>
                    {userData.verified && (
                        <View style={styles.verifiedBadge}>
                            <Icon name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.verifiedText}>TERVERIFIKASI</Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoGroup}>
                    <InfoRow
                        label="NOMOR INDUK KEPENDUDUKAN (NIK)"
                        value={userData.nik}
                        locked={true}
                    />
                    <InfoRow
                        label="NAMA LENGKAP"
                        value={userData.fullName}
                        locked={true}
                    />
                    <InfoRow
                        label="TEMPAT, TANGGAL LAHIR"
                        value={`${userData.tempatLahir || 'Kuningan'}, ${userData.tanggalLahir || '28 Januari 1990'}`}
                        locked={true}
                    />
                    <InfoRow
                        label="JENIS KELAMIN"
                        value={userData.jenisKelamin || 'Laki-laki'}
                        locked={true}
                    />
                </View>

                {/* Section: KONTAK & ALAMAT */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>KONTAK & ALAMAT</Text>
                </View>

                <View style={styles.infoGroup}>
                    <InfoRow
                        label="NOMOR TELEPON"
                        value={userData.phoneNumber || '0812-3456-7890'}
                        onPress={() => showToast("Fitur ubah nomor telepon segera hadir", "info")}
                    />
                    <InfoRow
                        label="ALAMAT EMAIL"
                        value={userData.email || 'ahmad.zul@gmail.com'}
                        onPress={() => showToast("Fitur ubah email segera hadir", "info")}
                    />
                    <InfoRow
                        label="ALAMAT LENGKAP"
                        value={userData.alamat || 'Alamat belum disetel'}
                        onPress={() => showToast("Fitur ubah alamat segera hadir", "info")}
                        isMultiline={true}
                    />
                </View>

                <Text style={styles.footerNote}>
                    Data identitas (NIK, Nama, TTL, Jenis Kelamin) diambil dari data Kependudukan (Dukcapil) dan tidak dapat diubah secara langsung. Hubungi layanan Dukcapil jika terdapat kesalahan data.
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const InfoRow = ({ label, value, locked, onPress, isMultiline }: any) => (
    <View style={styles.infoRow}>
        <View style={styles.infoTextColumn}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, isMultiline && { lineHeight: 22 }]}>{value || '-'}</Text>
        </View>
        <TouchableOpacity
            style={[styles.actionBtn, locked && { opacity: 0.3 }]}
            onPress={onPress}
            disabled={locked}
        >
            <Icon name={locked ? "lock-closed" : "pencil"} size={18} color="#94A3B8" />
        </TouchableOpacity>
    </View>
);

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
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#FFF',
        borderBottomWidth: 8,
        borderBottomColor: '#F8FAFC',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatarOutline: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        position: 'relative',
    },
    avatarInner: {
        width: 114,
        height: 114,
        borderRadius: 57,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#FFB800',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarHint: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: '#FFF',
    },
    sectionTitleText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#065F46',
        letterSpacing: 0.5,
    },
    infoGroup: {
        backgroundColor: '#FFF',
        borderBottomWidth: 8,
        borderBottomColor: '#F8FAFC',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    infoTextColumn: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    footerNote: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '500',
    },
});
