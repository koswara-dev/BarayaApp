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
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import api, { getImageUrl } from '../config/api';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';
import useUserStore from '../stores/userStore';
import SkeletonShimmer from '../components/SkeletonShimmer';

const SimpleEditModal = ({ visible, title, value, onChangeText, onSave, onCancel, multiline = false, loading = false }: any) => (
    <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TextInput
                    style={[styles.modalInput, multiline && { height: 80, textAlignVertical: 'top' }]}
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel} disabled={loading}>
                        <Text style={styles.modalBtnTextCancel}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnSave} onPress={onSave} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnTextSave}>Simpan</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const PasswordEditModal = ({ visible, onSave, onCancel, loading = false }: any) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSave = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Semua kolom harus diisi');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi kata sandi tidak cocok');
            return;
        }
        onSave(currentPassword, newPassword);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Ubah Kata Sandi</Text>
                    
                    <Text style={styles.inputLabel}>Kata Sandi Lama</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        placeholder="Masukkan kata sandi lama"
                    />

                    <Text style={styles.inputLabel}>Kata Sandi Baru</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        placeholder="Minimal 6 karakter"
                    />

                    <Text style={styles.inputLabel}>Konfirmasi Kata Sandi Baru</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholder="Ulangi kata sandi baru"
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel} disabled={loading}>
                            <Text style={styles.modalBtnTextCancel}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalBtnSave} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnTextSave}>Simpan</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Skeleton for Profile Detail Screen
const ProfileSkeleton = () => (
    <>
        {/* Avatar Skeleton */}
        <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarOutline}>
                    <SkeletonShimmer style={styles.avatarInner} />
                </View>
            </View>
            <SkeletonShimmer style={{ width: 120, height: 14 }} />
        </View>

        {/* Section Header Skeleton */}
        <View style={styles.sectionHeader}>
            <SkeletonShimmer style={{ width: 120, height: 12 }} />
            <SkeletonShimmer style={{ width: 100, height: 20, borderRadius: 4 }} />
        </View>

        {/* Info Rows Skeleton */}
        <View style={styles.infoGroup}>
            {[1, 2, 3, 4].map((_, index) => (
                <View key={index} style={styles.infoRow}>
                    <View style={styles.infoTextColumn}>
                        <SkeletonShimmer style={{ width: 150, height: 10, marginBottom: 6 }} />
                        <SkeletonShimmer style={{ width: '80%', height: 15 }} />
                    </View>
                    <SkeletonShimmer style={styles.actionBtn} />
                </View>
            ))}
        </View>

        {/* Second Section */}
        <View style={styles.sectionHeader}>
            <SkeletonShimmer style={{ width: 140, height: 12 }} />
        </View>

        <View style={styles.infoGroup}>
            {[1, 2, 3].map((_, index) => (
                <View key={index} style={styles.infoRow}>
                    <View style={styles.infoTextColumn}>
                        <SkeletonShimmer style={{ width: 100, height: 10, marginBottom: 6 }} />
                        <SkeletonShimmer style={{ width: index === 2 ? '100%' : '70%', height: 15 }} />
                    </View>
                    <SkeletonShimmer style={styles.actionBtn} />
                </View>
            ))}
        </View>
    </>
);

export default function ProfileDetailScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);

    const {
        profile,
        loading,
        error,
        fetchUserProfile,
        uploadUserPhoto,
        updateUserProfile,
        changeUserPassword,
    } = useUserStore();

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);

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

    // Use data strictly from profile
    const userData = profile || {
        fullName: user?.fullName || '',
        nik: '',
        phoneNumber: '',
        email: user?.email || '',
        alamat: '',
        urlFoto: '',
        verified: false,
    };

    const handleEdit = (field: string, value: string) => {
        setEditingField(field);
        setEditValue(value || '');
    };

    const handleSave = async () => {
        if (!editingField || !user?.id) return;

        // Validation
        if (editingField === 'phoneNumber') {
            if (!editValue.startsWith('628')) {
                showToast('Nomor telepon harus diawali 628', 'error');
                return;
            }
            if (editValue.length < 10) {
                 showToast('Nomor telepon terlalu pendek', 'error');
                 return;
            }
        }

        const success = await updateUserProfile(user.id, { [editingField]: editValue });
        if (success) {
            showToast('Data berhasil diperbarui', 'success');
            setEditingField(null);
        }
    };

    const handlePasswordChange = async (current: string, newPass: string) => {
        if (!user?.id) return;
        const success = await changeUserPassword(user.id, { current, new: newPass });
        if (success) {
            showToast('Kata sandi berhasil diubah', 'success');
            setPasswordModalVisible(false);
        }
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
                {loading ? (
                    <ProfileSkeleton />
                ) : (
                    <>
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
                                onPress={() => handleEdit('nik', userData.nik)}
                            />
                            <InfoRow
                                label="NAMA LENGKAP"
                                value={userData.fullName}
                                onPress={() => handleEdit('fullName', userData.fullName)}
                            />
                        </View>

                        {/* Section: KONTAK & ALAMAT */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitleText}>KONTAK & ALAMAT</Text>
                        </View>

                        <View style={styles.infoGroup}>
                            <InfoRow
                                label="NOMOR TELEPON"
                                value={userData.phoneNumber || '-'}
                                onPress={() => handleEdit('phoneNumber', userData.phoneNumber)}
                            />
                            <InfoRow
                                label="ALAMAT EMAIL"
                                value={userData.email || '-'}
                                onPress={() => handleEdit('email', userData.email)}
                            />
                            <InfoRow
                                label="ALAMAT LENGKAP"
                                value={userData.alamat || '-'}
                                onPress={() => handleEdit('alamat', userData.alamat)}
                                isMultiline={true}
                            />
                        </View>

                        {/* Section: KEAMANAN */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitleText}>KEAMANAN</Text>
                        </View>

                        <View style={styles.infoGroup}>
                            <TouchableOpacity style={styles.infoRow} onPress={() => setPasswordModalVisible(true)}>
                                <View style={styles.infoTextColumn}>
                                    <Text style={styles.infoLabel}>KATA SANDI</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.infoValue}>********</Text>
                                    </View>
                                </View>
                                <View style={styles.actionBtn}>
                                    <Icon name="chevron-forward" size={18} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 40 }} />

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            <SimpleEditModal
                visible={!!editingField}
                title={`Ubah ${editingField === 'phoneNumber' ? 'Nomor Telepon' : editingField === 'email' ? 'Email' : 'Alamat'}`}
                value={editValue}
                onChangeText={setEditValue}
                onCancel={() => setEditingField(null)}
                onSave={handleSave}
                loading={loading}
                multiline={editingField === 'alamat'}
            />

            <PasswordEditModal
                visible={isPasswordModalVisible}
                onCancel={() => setPasswordModalVisible(false)}
                onSave={handlePasswordChange}
                loading={loading}
            />
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        color: '#0F172A',
        fontSize: 14,
        marginBottom: 20
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12
    },
    modalBtnCancel: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    modalBtnTextCancel: {
        color: '#64748B',
        fontWeight: '600'
    },
    modalBtnSave: {
        backgroundColor: '#FFC107',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center'
    },
    modalBtnTextSave: {
        color: '#FFF',
        fontWeight: '700'
    }
});
