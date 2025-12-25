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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import usePengaturanStore, { Pengaturan } from '../../stores/pengaturanStore';
import useToastStore from '../../stores/toastStore';

// Define editable fields configuration
const PENGATURAN_FIELDS: { key: keyof Pengaturan; label: string; multiline?: boolean }[] = [
    { key: 'appName', label: 'Nama Aplikasi' },
    { key: 'slogan', label: 'Slogan' },
    { key: 'urlLogo', label: 'URL Logo' },
    { key: 'kabupaten', label: 'Kabupaten' },
    { key: 'provinsi', label: 'Provinsi' },
    { key: 'urlLogoKabupaten', label: 'URL Logo Kabupaten' },
    { key: 'namaBupati', label: 'Nama Bupati' },
    { key: 'urlFotoBupati', label: 'URL Foto Bupati' },
    { key: 'namaWakilBupati', label: 'Nama Wakil Bupati' },
    { key: 'urlFotoWakilBupati', label: 'URL Foto Wakil Bupati' },
    { key: 'namaSekda', label: 'Nama Sekda' },
    { key: 'urlFotoSekda', label: 'URL Foto Sekda' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Nomor Telepon' },
    { key: 'alamat', label: 'Alamat', multiline: true },
    { key: 'versi', label: 'Versi Aplikasi' },
];

export default function PengaturanScreen({ navigation }: any) {
    const { pengaturan, loading, error, fetchPengaturan, updatePengaturan, clearError } = usePengaturanStore();
    const showToast = useToastStore((state) => state.showToast);
    const [refreshing, setRefreshing] = useState(false);

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<{ key: keyof Pengaturan; label: string; multiline?: boolean } | null>(null);
    const [editValue, setEditValue] = useState('');
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

    const openEditModal = (field: { key: keyof Pengaturan; label: string; multiline?: boolean }) => {
        const currentValue = pengaturan ? String(pengaturan[field.key] || '') : '';
        setEditField(field);
        setEditValue(currentValue);
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editField) return;

        setSaving(true);
        const success = await updatePengaturan({ [editField.key]: editValue });
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
                                <Text style={styles.listValue} numberOfLines={field.multiline ? 3 : 1}>
                                    {getValue(field.key)}
                                </Text>
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
});
