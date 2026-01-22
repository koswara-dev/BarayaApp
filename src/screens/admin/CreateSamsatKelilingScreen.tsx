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
    KeyboardAvoidingView,
    Image,
    Animated,
    Dimensions
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

import useSamsatKelilingStore from '../../stores/samsatKelilingStore';
import useToastStore from '../../stores/toastStore';
import LoadingOverlay from '../../components/LoadingOverlay';
import IndustrialFormSection from '../../components/Form/IndustrialFormSection';
import IndustrialInput from '../../components/Form/IndustrialInput';
import IndustrialImagePicker from '../../components/Form/IndustrialImagePicker';
import { getImageUrl } from '../../config/api';

// Helper for time HH:mm
const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Helper for date YYYY-MM-DD
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function CreateSamsatScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { item } = route.params || {}; // If item exists, we are editing
    const isEdit = !!item;

    const { createSamsatKeliling, updateSamsatKeliling, loading: storeLoading } = useSamsatKelilingStore();
    const showToast = useToastStore((state) => state.showToast);

    // Form State
    const [form, setForm] = useState({
        tanggal: isEdit ? item.tanggal : '',
        jamMulai: isEdit ? item.jamMulai : '',
        jamSelesai: isEdit ? item.jamSelesai : '',
        lokasi: isEdit ? item.lokasi : '',
        latitude: isEdit ? String(item.latitude || '') : '',
        longitude: isEdit ? String(item.longitude || '') : '',
    });
    const [photo, setPhoto] = useState<any>(isEdit ? { uri: getImageUrl(item.urlGambar), isExisting: true } : null);

    // Picker State
    const [openDate, setOpenDate] = useState(false);
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [slideAnimPicker] = useState(new Animated.Value(400));
    const [slideAnimConfirm] = useState(new Animated.Value(400));

    const today = new Date();

    useEffect(() => {
        if (openDate || openStart || openEnd) {
            Animated.timing(slideAnimPicker, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimPicker.setValue(400);
        }
    }, [openDate, openStart, openEnd]);

    useEffect(() => {
        if (confirmModalVisible) {
            Animated.timing(slideAnimConfirm, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        } else {
            slideAnimConfirm.setValue(400);
        }
    }, [confirmModalVisible]);

    const handleSave = () => {
        // Validation
        if (!form.tanggal || !form.jamMulai || !form.jamSelesai || !form.lokasi) {
            showToast('Tanggal, Jam, dan Lokasi wajib diisi', 'error');
            return;
        }

        setConfirmModalVisible(true);
    };

    const confirmSubmit = async () => {
        setConfirmModalVisible(false);

        try {
            const payload = {
                tanggal: form.tanggal,
                jamMulai: form.jamMulai,
                jamSelesai: form.jamSelesai,
                lokasi: form.lokasi,
                latitude: form.latitude || null,
                longitude: form.longitude || null,
                foto: photo && !photo.isExisting ? photo : null, // Only send if new photo
            };

            if (isEdit) {
                await updateSamsatKeliling(item.id, payload);
                showToast('Jadwal berhasil diperbarui', 'success');
            } else {
                await createSamsatKeliling(payload);
                showToast('Jadwal berhasil dibuat', 'success');
            }
            navigation.goBack();
        } catch (err: any) {
            console.error('Submit error:', err);
            showToast(err.message || 'Gagal menyimpan jadwal.', 'error');
        }
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        mode: 'date' | 'time',
        currentVal: string, // YYYY-MM-DD or HH:mm
        onSelect: (val: string) => void,
        title: string
    ) => {
        // Parse current value to Date
        let dateObj = new Date();
        if (currentVal) {
            if (mode === 'date') {
                dateObj = new Date(currentVal);
            } else {
                const [h, m] = currentVal.split(':');
                dateObj.setHours(parseInt(h), parseInt(m));
            }
        }

        const [tempDate, setTempDate] = useState(dateObj);

         // Reset tempDate when modal opens
         useEffect(() => {
            if (visible) {
                 let d = new Date();
                 if (currentVal) {
                    if (mode === 'date') {
                        d = new Date(currentVal);
                    } else {
                        const [h, m] = currentVal.split(':');
                        d.setHours(parseInt(h), parseInt(m));
                    }
                }
                setTempDate(d);
            }
        }, [visible]);

        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={styles.pickerOverlay}>
                    <Animated.View style={[styles.pickerContent, { transform: [{ translateY: slideAnimPicker }] }]}>
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
                                mode={mode}
                                is24hourSource="locale"
                                theme="light"
                                style={{ width: Dimensions.get('window').width - 80, height: 200 }}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.pickerFooterBtn}
                            onPress={() => {
                                onSelect(mode === 'date' ? formatDate(tempDate) : formatTime(tempDate));
                                onClose();
                            }}
                        >
                            <Text style={styles.pickerFooterBtnText}>PILIH</Text>
                            <Icon name="checkmark-sharp" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <LoadingOverlay visible={storeLoading} message={isEdit ? "Memperbarui..." : "Menyimpan..."} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? "Edit Jadwal" : "Buat Jadwal Baru"}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <IndustrialFormSection title="INFORMASI LOKASI" stripeColor="#F59E0B" />
                
                <IndustrialInput
                    placeholder="Lokasi (misal: Alun-Alun Kuningan)"
                    value={form.lokasi}
                    onChangeText={(val) => setForm({...form, lokasi: val})}
                    style={{ fontWeight: '700' }}
                />
                
                <View style={{ height: 12 }} />
                
                <View style={styles.row}>
                    <View style={styles.col}>
                         <IndustrialInput
                            placeholder="Lat (Opsional)"
                            keyboardType="numeric"
                            value={form.latitude}
                            onChangeText={(val) => setForm({ ...form, latitude: val })}
                        />
                    </View>
                    <View style={styles.col}>
                         <IndustrialInput
                            placeholder="Lon (Opsional)"
                            keyboardType="numeric"
                            value={form.longitude}
                            onChangeText={(val) => setForm({ ...form, longitude: val })}
                        />
                    </View>
                </View>

                <IndustrialFormSection title="WAKTU PELAYANAN" stripeColor="#3B82F6" />
                
                <TouchableOpacity style={styles.dateField} onPress={() => setOpenDate(true)}>
                    <View style={styles.dateFieldInner}>
                        <Icon name="calendar-outline" size={18} color="#94A3B8" />
                        <Text style={[styles.dateValue, !form.tanggal && { color: '#94A3B8' }]}>
                            {form.tanggal || "Pilih Tanggal"}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 12 }} />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <TouchableOpacity style={styles.dateField} onPress={() => setOpenStart(true)}>
                            <View style={styles.dateFieldInner}>
                                <Icon name="time-outline" size={18} color="#94A3B8" />
                                <Text style={[styles.dateValue, !form.jamMulai && { color: '#94A3B8' }]}>
                                    {form.jamMulai || "Jam Mulai"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.col}>
                        <TouchableOpacity style={styles.dateField} onPress={() => setOpenEnd(true)}>
                            <View style={styles.dateFieldInner}>
                                <Icon name="time-outline" size={18} color="#94A3B8" />
                                <Text style={[styles.dateValue, !form.jamSelesai && { color: '#94A3B8' }]}>
                                    {form.jamSelesai || "Jam Selesai"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <IndustrialFormSection title="FOTO LOKASI (OPSIONAL)" stripeColor="#64748B" />
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
                        <View style={styles.publishBtnInner}>
                            <Text style={styles.publishBtnText}>{isEdit ? "SIMPAN PERUBAHAN" : "PUBLIKASIKAN JADWAL"}</Text>
                            <Icon name="send" size={20} color="#0F172A" />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Pickers */}
            {renderPickerModal(openDate, () => setOpenDate(false), 'date', form.tanggal, (val) => setForm({...form, tanggal: val}), "PILIH TANGGAL")}
            {renderPickerModal(openStart, () => setOpenStart(false), 'time', form.jamMulai, (val) => setForm({...form, jamMulai: val}), "JAM MULAI")}
            {renderPickerModal(openEnd, () => setOpenEnd(false), 'time', form.jamSelesai, (val) => setForm({...form, jamSelesai: val}), "JAM SELESAI")}

             {/* Confirmation Modal */}
             <Modal visible={confirmModalVisible} transparent animationType="fade" onRequestClose={() => setConfirmModalVisible(false)}>
                <View style={styles.confirmOverlay}>
                    <Animated.View style={[styles.confirmContent, { transform: [{ translateY: slideAnimConfirm }] }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>KONFIRMASI</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{maxHeight: 400}}>
                             <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>LOKASI</Text>
                                <Text style={styles.summaryValue}>{form.lokasi}</Text>
                             </View>
                             <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>WAKTU</Text>
                                <Text style={styles.summaryValue}>{form.tanggal} | {form.jamMulai} - {form.jamSelesai}</Text>
                             </View>
                             {photo && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>FOTO</Text>
                                    <Image source={{ uri: photo.uri }} style={styles.thumbnail} resizeMode="cover" />
                                </View>
                             )}
                        </ScrollView>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmSubmit}>
                             <Text style={styles.confirmBtnText}>YA, SIMPAN</Text>
                             <Icon name="checkmark-circle" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
             </Modal>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerBtn: { padding: 8 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
    content: { flex: 1 },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    dateField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', height: 52, justifyContent: 'center', marginHorizontal: 16, paddingHorizontal: 16 },
    dateFieldInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
    footer: { padding: 24, marginTop: 20 },
    publishBtn: { backgroundColor: '#F59E0B', paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    publishBtnDisabled: { backgroundColor: '#E2E8F0' },
    publishBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    publishBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '900' },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'flex-end' },
    pickerContent: { backgroundColor: '#FFFFFF', padding: 20 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    pickerTitle: { fontSize: 14, fontWeight: '900' },
    pickerBody: { alignItems: 'center' },
    pickerFooterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#F59E0B', marginTop: 10, gap: 8 },
    pickerFooterBtnText: { fontWeight: '900', color: '#0F172A' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 14, fontWeight: '900' },
    confirmOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 },
    confirmContent: { backgroundColor: '#FFFFFF', padding: 24 },
    summaryItem: { marginBottom: 16 },
    summaryLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', marginBottom: 4 },
    summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    thumbnail: { width: '100%', height: 150, marginTop: 8, backgroundColor: '#cbd5e1' },
    confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F59E0B', padding: 16, marginTop: 16, gap: 8 },
    confirmBtnText: { fontWeight: '900', color: '#0F172A' }
});
