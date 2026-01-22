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
    Dimensions,
    Animated,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDebounce } from 'use-debounce';

import useEventStore from '../../stores/eventStore';
import useLayananStore from '../../stores/layananStore';
import useToastStore from '../../stores/toastStore';
// useNotificationStore removed
import LoadingOverlay from '../../components/LoadingOverlay';
import PrimaryButton from '../../components/PrimaryButton';
import IndustrialFormSection from '../../components/Form/IndustrialFormSection';
import IndustrialInput from '../../components/Form/IndustrialInput';
import IndustrialImagePicker from '../../components/Form/IndustrialImagePicker';

// Helper to format Date to LocalDateTime string (yyyy-MM-ddTHH:mm:ss)
const formatToLocalDateTime = (date: Date) => {
    const pad = (num: number) => (num < 10 ? '0' : '') + num;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDisplayDate = (isoString: string) => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return isoString;
    }
};

export default function CreateEventScreen() {
    const navigation = useNavigation<any>();
    const { createEvent, loading: storeLoading } = useEventStore();
    // notification store removed
    const { dinas, fetchDinas, loading: dinasLoading } = useLayananStore();
    const showToast = useToastStore((state) => state.showToast);

    // Form State
    const [form, setForm] = useState({
        judul: '',
        deskripsi: '',
        tanggalMulai: '',
        tanggalSelesai: '',
        lokasi: '',
        latitude: '',
        longitude: '',
        dinasId: null as number | null,
        dinasNama: '',
    });
    const [photo, setPhoto] = useState<any>(null);

    // Dinas Search State
    const [dinasSearch, setDinasSearch] = useState('');
    const [debouncedDinasSearch] = useDebounce(dinasSearch, 500);

    // Picker State
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);

    // Modal State
    const [dinasModalVisible, setDinasModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);

    // Animation values
    const [slideAnimDinas] = useState(new Animated.Value(400));
    const [slideAnimConfirm] = useState(new Animated.Value(400));
    const [slideAnimPicker] = useState(new Animated.Value(400));

    // Stabilize date references to prevent infinite loops
    const today = React.useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const minEndDate = React.useMemo(() => {
        if (!form.tanggalMulai) return today;
        const d = new Date(form.tanggalMulai);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [form.tanggalMulai, today]);

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
        if (openStart || openEnd) {
            Animated.timing(slideAnimPicker, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimPicker.setValue(400);
        }
    }, [openStart, openEnd]);

    useEffect(() => {
        fetchDinas({ nama: debouncedDinasSearch });
    }, [debouncedDinasSearch]);

    const handleSave = () => {
        // Validation
        if (!form.judul || !form.deskripsi || !form.tanggalMulai || !form.tanggalSelesai || !form.lokasi || !form.dinasId) {
            showToast('Semua field wajib harus diisi', 'error');
            return;
        }

        // Show summary first
        setConfirmModalVisible(true);
    };

    const confirmSubmit = async () => {
        setConfirmModalVisible(false);

        try {
            const newEvent = await createEvent({
                judul: form.judul,
                deskripsi: form.deskripsi,
                tanggalMulai: form.tanggalMulai,
                tanggalSelesai: form.tanggalSelesai,
                lokasi: form.lokasi,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
                dinasId: form.dinasId,
                foto: photo,
            });

            // Notification sending removed as it is handled by backend

            showToast('Event berhasil dibuat', 'success');
            navigation.goBack();

        } catch (err: any) {
            console.error('Final submit error:', err);
            showToast(err.message || 'Gagal membuat agenda. Silakan cek koneksi Anda.', 'error');
        }
    };

    const selectDinas = (item: any) => {
        setForm({ ...form, dinasId: item.id, dinasNama: item.nama });
        setDinasModalVisible(false);
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        initialDate: Date,
        onSelect: (date: Date) => void,
        title: string,
        minimumDate?: Date
    ) => {
        const [tempDate, setTempDate] = useState(initialDate);

        // Reset tempDate only when modal BECOMES visible
        useEffect(() => {
            if (visible) {
                let startDate = initialDate;
                if (minimumDate && initialDate < minimumDate) {
                    startDate = minimumDate;
                }
                setTempDate(startDate);
            }
        }, [visible]); // Only depend on visible to break loop

        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.pickerOverlay}>
                    <Animated.View
                        style={[
                            styles.pickerContent,
                            { transform: [{ translateY: slideAnimPicker }] }
                        ]}
                    >
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerBody}>
                            <DatePicker
                                date={tempDate}
                                onDateChange={setTempDate}
                                minimumDate={minimumDate}
                                mode="date"
                                is24hourSource="locale"
                                theme="light"
                                style={{ width: Dimensions.get('window').width - 80, height: 250 }}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.pickerFooterBtn}
                            onPress={() => {
                                onSelect(tempDate);
                                onClose();
                            }}
                        >
                            <Text style={styles.pickerFooterBtnText}>KONFIRMASI PILIHAN</Text>
                            <Icon name="checkmark-sharp" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <LoadingOverlay
                visible={storeLoading}
                message="Sedang Mempublikasikan Agenda..."
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buat Agenda Baru</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* 1. Informasi Agenda */}
                <IndustrialFormSection title="INFORMASI AGENDA" stripeColor="#FFB800" />

                <IndustrialInput
                    placeholder="Judul Agenda / Kegiatan"
                    value={form.judul}
                    onChangeText={(val) => setForm({ ...form, judul: val })}
                    style={{ fontWeight: '900' }}
                />

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Deskripsi Lengkap Kegiatan..."
                    multiline
                    maxLength={2000}
                    value={form.deskripsi}
                    onChangeText={(val) => setForm({ ...form, deskripsi: val })}
                    showCounter
                />

                {/* 2. Waktu Pelaksanaan */}
                <IndustrialFormSection title="WAKTU PELAKSANAAN" stripeColor="#3B82F6" />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <TouchableOpacity
                            style={styles.dateField}
                            onPress={() => setOpenStart(true)}
                        >
                            <View style={styles.dateFieldInner}>
                                <Icon name="calendar-outline" size={18} color="#94A3B8" />
                                <Text style={[styles.dateValue, !form.tanggalMulai && { color: '#94A3B8' }]}>
                                    {form.tanggalMulai ? formatDisplayDate(form.tanggalMulai) : "Mulai"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.col}>
                        <TouchableOpacity
                            style={styles.dateField}
                            onPress={() => setOpenEnd(true)}
                        >
                            <View style={styles.dateFieldInner}>
                                <Icon name="calendar-outline" size={18} color="#94A3B8" />
                                <Text style={[styles.dateValue, !form.tanggalSelesai && { color: '#94A3B8' }]}>
                                    {form.tanggalSelesai ? formatDisplayDate(form.tanggalSelesai) : "Selesai"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Custom Pickers */}
                {renderPickerModal(
                    openStart,
                    () => setOpenStart(false),
                    form.tanggalMulai ? new Date(form.tanggalMulai) : today,
                    (date) => {
                        const newStart = formatToLocalDateTime(date);
                        let newForm = { ...form, tanggalMulai: newStart };

                        // If end date is before new start date, adjust it
                        if (form.tanggalSelesai && new Date(form.tanggalSelesai) < date) {
                            newForm.tanggalSelesai = newStart;
                        }

                        setForm(newForm);
                    },
                    "TANGGAL MULAI",
                    today
                )}

                {renderPickerModal(
                    openEnd,
                    () => setOpenEnd(false),
                    form.tanggalSelesai ? new Date(form.tanggalSelesai) : minEndDate,
                    (date) => setForm({ ...form, tanggalSelesai: formatToLocalDateTime(date) }),
                    "TANGGAL SELESAI",
                    minEndDate
                )}

                {/* 3. Lokasi & Instansi */}
                <IndustrialFormSection title="LOKASI & INSTANSI" stripeColor="#E11D48" />

                <IndustrialInput
                    placeholder="Alamat Lokasi (contoh: Taman Pandapa)"
                    value={form.lokasi}
                    onChangeText={(val) => setForm({ ...form, lokasi: val })}
                />

                <View style={{ height: 12 }} />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <IndustrialInput
                            placeholder="Latitude (Opsional)"
                            keyboardType="numeric"
                            value={form.latitude}
                            onChangeText={(val) => setForm({ ...form, latitude: val })}
                        />
                    </View>
                    <View style={styles.col}>
                        <IndustrialInput
                            placeholder="Longitude (Opsional)"
                            keyboardType="numeric"
                            value={form.longitude}
                            onChangeText={(val) => setForm({ ...form, longitude: val })}
                        />
                    </View>
                </View>

                <View style={{ height: 12 }} />

                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setDinasModalVisible(true)}
                >
                    <View style={styles.dropdownInner}>
                        <Icon name="business-outline" size={20} color="#94A3B8" />
                        <Text style={[styles.dropdownText, !form.dinasNama && styles.placeholderText]}>
                            {form.dinasNama || "Pilih Instansi Penanggung Jawab"}
                        </Text>
                    </View>
                    <Icon name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>

                {/* 4. Lampiran */}
                <IndustrialFormSection title="LAMPIRAN FOTO" stripeColor="#64748B" />

                <IndustrialImagePicker
                    photo={photo}
                    onPhotoSelected={setPhoto}
                    onPhotoRemoved={() => setPhoto(null)}
                />

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.publishBtn, storeLoading && styles.publishBtnDisabled]}
                        onPress={handleSave}
                        disabled={storeLoading}
                    >
                        {storeLoading ? (
                            <ActivityIndicator color="#0F172A" />
                        ) : (
                            <View style={styles.publishBtnInner}>
                                <Text style={styles.publishBtnText}>PUBLIKASIKAN AGENDA</Text>
                                <Icon name="send" size={20} color="#0F172A" />
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
                            <Text style={styles.modalTitle}>PILIH INSTANSI</Text>
                            <TouchableOpacity onPress={() => setDinasModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <IndustrialInput
                                placeholder="Cari Instansi..."
                                value={dinasSearch}
                                onChangeText={setDinasSearch}
                            />
                        </View>

                        {dinasLoading ? (
                            <ActivityIndicator size="large" color="#F59E0B" style={{ marginVertical: 40 }} />
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
                            <Text style={styles.modalTitle}>KONFIRMASI PUBLIKASI</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>JUDUL AGENDA</Text>
                                <Text style={styles.summaryValue}>{form.judul}</Text>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>DESKRIPSI</Text>
                                <Text style={[styles.summaryValue, { fontWeight: '400', fontSize: 13 }]}>{form.deskripsi}</Text>
                            </View>

                            <View style={styles.summaryRow}>
                                <View style={styles.summaryCol}>
                                    <Text style={styles.summaryLabel}>MULAI</Text>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{formatDisplayDate(form.tanggalMulai)}</Text>
                                    </View>
                                </View>
                                <View style={styles.summaryCol}>
                                    <Text style={styles.summaryLabel}>SELESAI</Text>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{formatDisplayDate(form.tanggalSelesai)}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>LOKASI</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="location" size={16} color="#E11D48" />
                                    <Text style={styles.summaryValue}>{form.lokasi}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>INSTANSI</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="business" size={16} color="#3B82F6" />
                                    <Text style={styles.summaryValue}>{form.dinasNama}</Text>
                                </View>
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
                            <Text style={styles.confirmBtnText}>YA, PUBLIKASIKAN SEKARANG</Text>
                            <Icon name="checkmark-circle" size={20} color="#0F172A" />
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
    row: {
        flexDirection: 'row',
        gap: 0,
    },
    col: {
        flex: 1,
    },
    dateField: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 52,
        justifyContent: 'center',
        marginHorizontal: 16,
        paddingHorizontal: 16,
    },
    dateFieldInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
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
        height: 52,
    },
    dropdownInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dropdownText: {
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
        backgroundColor: '#FFB800',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
        // No shadow/elevation
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
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    // Modal Styles
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
    // Confirm Modal Styles
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
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
    },
    summaryCol: {
        flex: 1,
    },
    summaryRowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0F172A',
    },
    tag: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
    },
    tagText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    thumbnail: {
        width: '100%',
        height: 150,
        marginTop: 8,
        backgroundColor: '#F8FAFC',
    },
    confirmBtn: {
        backgroundColor: '#FFB800',
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
        color: '#0F172A',
        letterSpacing: 1,
    },
    // Custom Picker Styles
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        justifyContent: 'center',
        padding: 24,
    },
    pickerContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    pickerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    },
    pickerBody: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerFooterBtn: {
        backgroundColor: '#FFB800',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    pickerFooterBtnText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 1,
    }
});
