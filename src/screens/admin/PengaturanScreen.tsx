import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
    StatusBar,
    RefreshControl,
    Modal,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import usePengaturanStore, { Pengaturan } from '../../stores/pengaturanStore';
import useToastStore from '../../stores/toastStore';
import { getImageUrl } from '../../config/api';

const PENGATURAN_FIELDS: { key: keyof Pengaturan; label: string; multiline?: boolean; type: 'text' | 'image' }[] = [
    { key: 'appName', label: 'Nama Aplikasi', type: 'text' },
    { key: 'slogan', label: 'Slogan', type: 'text' },
    { key: 'urlLogo', label: 'Logo Aplikasi', type: 'image' },
    { key: 'kabupaten', label: 'Kabupaten', type: 'text' },
    { key: 'provinsi', label: 'Provinsi', type: 'text' },
    { key: 'urlLogoKabupaten', label: 'Logo Kabupaten', type: 'image' },
    { key: 'namaBupati', label: 'Nama Bupati', type: 'text' },
    { key: 'urlFotoBupati', label: 'Foto Bupati', type: 'image' },
    { key: 'namaWakilBupati', label: 'Nama Wakil Bupati', type: 'text' },
    { key: 'urlFotoWakilBupati', label: 'Foto Wakil Bupati', type: 'image' },
    { key: 'namaSekda', label: 'Nama Sekda', type: 'text' },
    { key: 'urlFotoSekda', label: 'Foto Sekda', type: 'image' },
    { key: 'urlBannerMobile', label: 'Banner Mobile', type: 'image' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phoneNumber', label: 'Nomor Telepon', type: 'text' },
    { key: 'alamat', label: 'Alamat', multiline: true, type: 'text' },
    { key: 'versi', label: 'Versi Aplikasi', type: 'text' },
];

export default function PengaturanScreen({ navigation }: any) {
    const { pengaturan, loading, error, fetchPengaturan, updatePengaturan, clearError } = usePengaturanStore();
    const showToast = useToastStore((state) => state.showToast);
    const [refreshing, setRefreshing] = useState(false);

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<{ key: keyof Pengaturan; label: string; multiline?: boolean; type: 'text' | 'image' } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPengaturan();
    }, []);

    useEffect(() => {
        if (error) {
            showToast(error, 'error');
            clearError();
        }
    }, [error]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPengaturan();
        setRefreshing(false);
    };

    const openEditModal = (field: { key: keyof Pengaturan; label: string; multiline?: boolean; type: 'text' | 'image' }) => {
        const currentValue = pengaturan ? String(pengaturan[field.key] || '') : '';
        setEditField(field);
        setEditValue(currentValue);
        setSelectedImage(null);
        setEditModalVisible(true);
    };

    const handleImagePick = async () => {
        const { launchImageLibrary } = require('react-native-image-picker');
        const options = {
            mediaType: 'photo',
            quality: 0.8,
        };

        launchImageLibrary(options, (response: any) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                showToast('Gagal memuat gambar', 'error');
                return;
            }
            if (response.assets && response.assets.length > 0) {
                setSelectedImage(response.assets[0]);
            }
        });
    };

    const handleSaveEdit = async () => {
        if (!editField) return;

        setSaving(true);
        let success = false;

        if (editField.type === 'image') {
            if (!selectedImage) {
                showToast('Silakan pilih gambar baru terlebih dahulu', 'info');
                setSaving(false);
                return;
            }

            // Map frontend key to backend/store key expectation
            let fileKey = 'file';
            if (editField.key === 'urlLogo') fileKey = 'logo';
            else if (editField.key === 'urlLogoKabupaten') fileKey = 'logoKabupaten';
            else if (editField.key === 'urlFotoBupati') fileKey = 'fotoBupati';
            else if (editField.key === 'urlFotoWakilBupati') fileKey = 'fotoWakilBupati';
            else if (editField.key === 'urlFotoSekda') fileKey = 'fotoSekda';
            else if (editField.key === 'urlBannerMobile') fileKey = 'bannerMobile';

            // Pass object with key: imageObject
            const updatePayload = {
                [fileKey]: {
                    uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
                    type: selectedImage.type || 'image/jpeg',
                    fileName: selectedImage.fileName || 'upload.jpg',
                }
            };

            success = await updatePengaturan(updatePayload);
        } else {
            success = await updatePengaturan({ [editField.key]: editValue });
        }

        setSaving(false);

        if (success) {
            showToast('Pengaturan berhasil diperbarui', 'success');
            setEditModalVisible(false);
        }
    };

    const getValue = (key: keyof Pengaturan): string => {
        if (!pengaturan) return '-';
        const value = pengaturan[key];
        if (value === null || value === undefined || value === '') return '-';
        return String(value);
    };

    if (loading && !pengaturan) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Memuat pengaturan...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pengaturan</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />
                }
            >
                {/* Settings List */}
                <View style={styles.listContainer}>
                    {PENGATURAN_FIELDS.map((field, index) => (
                        <View key={field.key} style={[styles.listItem, index === 0 && styles.listItemFirst]}>
                            <View style={styles.listTextContainer}>
                                <Text style={styles.listLabel}>{field.label}</Text>
                                {field.type === 'image' ? (
                                    <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                                        {pengaturan && pengaturan[field.key] ? (
                                            <Image 
                                                source={{ uri: getImageUrl(String(pengaturan[field.key])) }} 
                                                style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#F1F5F9' }} 
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Text style={styles.listValue}>-</Text>
                                        )}
                                    </View>
                                ) : (
                                    <Text style={styles.listValue} numberOfLines={field.multiline ? 3 : 1}>
                                        {getValue(field.key)}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() => openEditModal(field)}
                            >
                                <Icon name="pencil" size={18} color="#F59E0B" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Footer Info */}
                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>
                        Terakhir diperbarui: {pengaturan?.updatedAt ? new Date(pengaturan.updatedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : '-'}
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit {editField?.label}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {editField?.type === 'image' ? (
                            <View>
                                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                    {selectedImage ? (
                                        <Image 
                                            source={{ uri: selectedImage.uri }} 
                                            style={{ width: 200, height: 120, borderRadius: 12, backgroundColor: '#F1F5F9' }} 
                                            resizeMode="contain"
                                        />
                                    ) : editValue ? (
                                         <Image 
                                            source={{ uri: getImageUrl(editValue) }} 
                                            style={{ width: 200, height: 120, borderRadius: 12, backgroundColor: '#F1F5F9' }} 
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <View style={{ width: 200, height: 120, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                                            <Icon name="image-outline" size={48} color="#CBD5E1" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.pickImageBtn} onPress={handleImagePick}>
                                    <Icon name="camera" size={20} color="#0F172A" />
                                    <Text style={styles.pickImageText}>Pilih Gambar Baru</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TextInput
                                style={[
                                    styles.modalInput,
                                    editField?.multiline && styles.modalInputMultiline
                                ]}
                                value={editValue}
                                onChangeText={setEditValue}
                                placeholder={`Masukkan ${editField?.label?.toLowerCase()}`}
                                placeholderTextColor="#94A3B8"
                                multiline={editField?.multiline}
                                numberOfLines={editField?.multiline ? 4 : 1}
                            />
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleSaveEdit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Simpan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
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
        fontWeight: '900',
        color: '#0F172A',
    },
    content: {
        flex: 1,
    },
    // List Styles
    listContainer: {
        backgroundColor: '#FFFFFF',
        marginTop: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    listItemFirst: {
        borderTopWidth: 0,
    },
    listTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    listLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 4,
    },
    listValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 22,
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    // Footer
    footerInfo: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 0,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    modalInputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 0,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748B',
    },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 0,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pickImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
    },
    pickImageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
});
