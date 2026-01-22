import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    ActivityIndicator,
    Modal,
    FlatList,
    KeyboardAvoidingView,
    Image,
    Animated,
    TextInput,
} from 'react-native';
import { useDebounce } from 'use-debounce';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import usePengaduanStore from '../stores/pengaduanStore';
import useDinasStore from '../stores/dinasStore';
import useToastStore from '../stores/toastStore';
import LoadingOverlay from '../components/LoadingOverlay';
import IndustrialFormSection from '../components/Form/IndustrialFormSection';
import IndustrialInput from '../components/Form/IndustrialInput';
import IndustrialImagePicker from '../components/Form/IndustrialImagePicker';
import { containsBadWords } from '../utils/badWords';

export default function CreatePengaduanScreen() {
    const navigation = useNavigation<any>();
    const { createPengaduan, loading: storeLoading } = usePengaduanStore();
    const { dinasList: dinas, fetchDinas, loading: dinasLoading } = useDinasStore();
    const showToast = useToastStore((state) => state.showToast);

    // Form State
    const [form, setForm] = useState({
        pesan: '',
        dinasId: null as number | null,
        dinasNama: '',
    });
    const [photo, setPhoto] = useState<any>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch] = useDebounce(searchQuery, 500);

    // Modal State
    const [dinasModalVisible, setDinasModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);

    // Animation values
    const [slideAnimDinas] = useState(new Animated.Value(400));
    const [slideAnimConfirm] = useState(new Animated.Value(400));

    useEffect(() => {
        if (dinasModalVisible) {
            Animated.timing(slideAnimDinas, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimDinas.setValue(400);
        }
    }, [dinasModalVisible]);

    useEffect(() => {
        if (confirmModalVisible) {
            Animated.timing(slideAnimConfirm, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimConfirm.setValue(400);
        }
    }, [confirmModalVisible]);

    useEffect(() => {
        // Fetch dinas when search query changes (debounced)
        fetchDinas(0, 50, debouncedSearch);
    }, [debouncedSearch]);

    const handleSave = () => {
        // Validation
        if (!form.pesan || !form.dinasId || !photo) {
            showToast('Mohon lengkapi detail pengaduan, pilih dinas, dan sertakan foto bukti.', 'error');
            return;
        }

        // Check for bad words
        if (containsBadWords(form.pesan)) {
            showToast('Pesan mengandung kata-kata yang tidak pantas. Mohon gunakan bahasa yang sopan.', 'error');
            return;
        }

        // Show summary first
        setConfirmModalVisible(true);
    };

    const confirmSubmit = async () => {
        setConfirmModalVisible(false);

        try {
            await createPengaduan({
                pesan: form.pesan,
                dinasId: form.dinasId,
                foto: photo,
            });

            showToast('Pengaduan berhasil dikirim', 'success');
            navigation.goBack();

        } catch (err: any) {
            console.error('Final submit error:', err);
            showToast(err.message || 'Gagal mengirim pengaduan. Silakan cobalagi.', 'error');
        }
    };

    const selectDinas = (item: any) => {
        setForm({ ...form, dinasId: item.id, dinasNama: item.nama });
        setDinasModalVisible(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <LoadingOverlay
                visible={storeLoading}
                message="Sedang Mengirim Pengaduan..."
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buat Pengaduan</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* 1. Informasi Pengaduan */}
                <IndustrialFormSection title="RINCIAN PENGADUAN" stripeColor="#EF4444" />

                <IndustrialInput
                    placeholder="Tuliskan keluhan atau laporan Anda secara lengkap..."
                    multiline
                    maxLength={1000}
                    value={form.pesan}
                    onChangeText={(val) => setForm({ ...form, pesan: val })}
                    showCounter
                    style={{ minHeight: 120, textAlignVertical: 'top', marginTop: 16 }}
                />

                <View style={{ height: 12 }} />

                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setDinasModalVisible(true)}
                >
                    <View style={styles.dropdownInner}>
                        <Icon name="business-outline" size={20} color="#94A3B8" />
                        <Text style={[styles.dropdownText, !form.dinasNama && styles.placeholderText]}>
                            {form.dinasNama || "Pilih Instansi Terkait"}
                        </Text>
                    </View>
                    <Icon name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>

                {/* 2. Lampiran */}
                <IndustrialFormSection title="BUKTI FOTO (WAJIB)" stripeColor="#64748B" />

                <IndustrialImagePicker
                    photo={photo}
                    onPhotoSelected={setPhoto}
                    onPhotoRemoved={() => setPhoto(null)}
                    cameraOnly={true}
                />

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.publishBtn, storeLoading && styles.publishBtnDisabled]}
                        onPress={handleSave}
                        disabled={storeLoading}
                    >
                        {storeLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <View style={styles.publishBtnInner}>
                                <Text style={styles.publishBtnText}>KIRIM PENGADUAN</Text>
                                <Icon name="paper-plane" size={20} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Dinas Modal */}
            <Modal
                visible={dinasModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDinasModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ translateY: slideAnimDinas }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>PILIH INSTANSI TUJUAN</Text>
                            <TouchableOpacity onPress={() => setDinasModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                         {/* Search Input */}
                         <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            backgroundColor: '#F1F5F9', 
                            paddingHorizontal: 12, 
                            borderRadius: 8,
                            marginBottom: 16,
                            height: 48
                        }}>
                            <Icon name="search" size={20} color="#94A3B8" />
                            <TextInput
                                style={{ flex: 1, marginLeft: 8, color: '#0F172A', fontSize: 14 }}
                                placeholder="Cari nama dinas..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Icon name="close-circle" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {dinasLoading ? (
                            <ActivityIndicator size="large" color="#EF4444" style={{ marginVertical: 40 }} />
                        ) : (
                            <FlatList
                                data={dinas}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.dinasItem}
                                        onPress={() => selectDinas(item)}
                                    >
                                        <Text style={styles.dinasItemText}>{item.nama}</Text>
                                    </TouchableOpacity>
                                )}
                                style={{ maxHeight: 400 }}
                                ListEmptyComponent={
                                    <View style={{ padding: 20, alignItems: 'center' }}>
                                        <Text style={{ color: '#94A3B8' }}>Dinas tidak ditemukan</Text>
                                    </View>
                                }
                            />
                        )}
                    </Animated.View>
                </View>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                visible={confirmModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View style={styles.confirmOverlay}>
                    <Animated.View
                        style={[
                            styles.confirmContent,
                            { transform: [{ translateY: slideAnimConfirm }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>KONFIRMASI PENGADUAN</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>TUJUAN INSTANSI</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="business" size={16} color="#3B82F6" />
                                    <Text style={styles.summaryValue}>{form.dinasNama}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>ISI PENGADUAN</Text>
                                <Text style={[styles.summaryValue, { fontWeight: '400', fontSize: 13, lineHeight: 20 }]}>{form.pesan}</Text>
                            </View>

                            {photo && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>LAMPIRAN FOTO</Text>
                                    <Image source={{ uri: photo.uri }} style={styles.thumbnail} resizeMode="cover" />
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={confirmSubmit}
                        >
                            <Text style={styles.confirmBtnText}>YA, KIRIM SEKARANG</Text>
                            <Icon name="checkmark-circle" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
    dropdown: {
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 52,
    },
    dropdownInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginRight: 8,
    },
    dropdownText: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
    },
    placeholderText: {
        color: '#94A3B8',
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        marginTop: 20,
    },
    publishBtn: {
        backgroundColor: '#F59E0B',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
        elevation: 0,
        shadowOpacity: 0,
    },
    publishBtnDisabled: {
        backgroundColor: '#E2E8F0',
    },
    publishBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    publishBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    dinasItem: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dinasItemText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '700',
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    confirmContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 0,
    },
    summaryItem: {
        marginBottom: 16,
    },
    summaryRowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        paddingRight: 10,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 4,
    },
    summaryValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },
    thumbnail: {
        width: '100%',
        height: 150,
        marginTop: 8,
        backgroundColor: '#F8FAFC',
    },
    confirmBtn: {
        backgroundColor: '#F59E0B',
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
