import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    Modal,
    ActivityIndicator,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useDinasStore from '../../stores/dinasStore';
import useToastStore from '../../stores/toastStore';
import useNotificationStore from '../../stores/notificationStore';
import LoadingOverlay from '../../components/LoadingOverlay';
import IndustrialFormSection from '../../components/Form/IndustrialFormSection';
import IndustrialInput from '../../components/Form/IndustrialInput';
import IndustrialImagePicker from '../../components/Form/IndustrialImagePicker';

export default function CreateDinasScreen() {
    const navigation = useNavigation<any>();
    const { createDinas, loading } = useDinasStore();
    const { sendNotification } = useNotificationStore();
    const showToast = useToastStore((state) => state.showToast);

    const [form, setForm] = useState({
        nama: '',
        deskripsi: '',
        alamat: '',
        latitude: '',
        longitude: '',
        website: '',
        namaKadis: '',
        jumlahPegawai: '',
        dataPrestasi: '',
        mediaSosial: ''
    });

    const [photo, setPhoto] = useState<any>(null);

    const [confirmModalVisible, setConfirmModalVisible] = useState(false);

    // Animation values
    const [slideAnimConfirm] = useState(new Animated.Value(300));

    useEffect(() => {
        if (confirmModalVisible) {
            Animated.timing(slideAnimConfirm, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnimConfirm.setValue(300);
        }
    }, [confirmModalVisible]);

    const handleSave = () => {
        if (!form.nama || !form.deskripsi || !form.alamat || !form.namaKadis) {
            showToast('Field Nama, Deskripsi, Alamat, dan Nama Kadis wajib diisi', 'error');
            return;
        }
        setConfirmModalVisible(true);
    };

    const confirmSubmit = async () => {
        setConfirmModalVisible(false);
        try {
            const result = await createDinas({
                ...form,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
                fotoStruktur: photo 
            });
            
            if (!result) return; // If create failed (null returned)

            // Broadcast notification
            await sendNotification({
                judul: `Info Dinas: ${form.nama}`,
                pesan: `Informasi mengenai ${form.nama} kini telah diperbarui. Simak profil lengkapnya.`,
                category: 'DINAS',
                dinasId: result.id,
                target: 'all'
            });

            showToast('Dinas berhasil dibuat', 'success');
            navigation.goBack();
        } catch (err: any) {
            showToast(err.message || 'Gagal membuat dinas', 'error');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <LoadingOverlay
                visible={loading}
                message="Sedang Menyimpan Data Dinas..."
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buat Dinas Baru</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <IndustrialFormSection title="INFORMASI DINAS" stripeColor="#FFB800" />

                <IndustrialInput
                    placeholder="Nama Instansi / Dinas"
                    value={form.nama}
                    onChangeText={(val) => setForm({ ...form, nama: val })}
                    style={{ fontWeight: '900' }}
                />

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Deskripsi Singkat..."
                    multiline
                    maxLength={200}
                    value={form.deskripsi}
                    onChangeText={(val) => setForm({ ...form, deskripsi: val })}
                    showCounter
                />

                <IndustrialFormSection title="KEPEMIMPINAN & KONTAK" stripeColor="#3B82F6" />

                <IndustrialInput
                    placeholder="Nama Kepala Dinas"
                    value={form.namaKadis}
                    onChangeText={(val) => setForm({ ...form, namaKadis: val })}
                />

                <View style={{ height: 12 }} />

                 <IndustrialInput
                    placeholder="Jumlah Pegawai"
                    keyboardType="numeric"
                    value={form.jumlahPegawai}
                    onChangeText={(val) => setForm({ ...form, jumlahPegawai: val })}
                />

                <View style={{ height: 12 }} />

                 <IndustrialInput
                    placeholder="Foto Struktur Organisasi (Upload)"
                    editable={false}
                    value={photo ? "Foto Terpilih" : "Belum ada foto"}
                    style={{ color: '#94A3B8' }}
                />
                 <IndustrialImagePicker
                    photo={photo}
                    onPhotoSelected={setPhoto}
                    onPhotoRemoved={() => setPhoto(null)}
                />

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Website Resmi (https://...)"
                    value={form.website}
                    onChangeText={(val) => setForm({ ...form, website: val })}
                />

                <IndustrialFormSection title="LOKASI & ALAMAT" stripeColor="#E11D48" />

                <IndustrialInput
                    placeholder="Alamat Lengkap"
                    multiline
                    value={form.alamat}
                    onChangeText={(val) => setForm({ ...form, alamat: val })}
                />

                 <View style={{ height: 12 }} />

                <IndustrialFormSection title="TAMBAHAN INFO" stripeColor="#8B5CF6" />
                
                <IndustrialInput
                    placeholder="Data Prestasi"
                    multiline
                    value={form.dataPrestasi}
                    onChangeText={(val) => setForm({ ...form, dataPrestasi: val })}
                />

                <View style={{ height: 12 }} />

                <IndustrialInput
                    placeholder="Media Sosial (Pisahkan koma)"
                    value={form.mediaSosial}
                    onChangeText={(val) => setForm({ ...form, mediaSosial: val })}
                />

                <View style={{ height: 12 }} />

                <View style={styles.row}>
                    <View style={styles.col}>
                        <IndustrialInput
                            placeholder="Latitude"
                            keyboardType="numeric"
                            value={form.latitude}
                            onChangeText={(val) => setForm({ ...form, latitude: val })}
                        />
                    </View>
                    <View style={styles.col}>
                        <IndustrialInput
                            placeholder="Longitude"
                            keyboardType="numeric"
                            value={form.longitude}
                            onChangeText={(val) => setForm({ ...form, longitude: val })}
                        />
                    </View>
                </View>

                {/* Footer Action matching CreateEvent style */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.publishBtn, loading && styles.publishBtnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0F172A" />
                        ) : (
                            <View style={styles.publishBtnInner}>
                                <Text style={styles.publishBtnText}>SIMPAN DATA DINAS</Text>
                                <Icon name="save-outline" size={20} color="#0F172A" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Confirmation Modal */}
            <Modal visible={confirmModalVisible} transparent animationType="fade">
                <View style={styles.confirmOverlay}>
                    <Animated.View
                        style={[
                            styles.confirmContent,
                            { transform: [{ translateY: slideAnimConfirm }] }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>KONFIRMASI DATA DINAS</Text>
                            <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                                <Icon name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>NAMA DINAS</Text>
                                <Text style={styles.summaryValue}>{form.nama}</Text>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>DESKRIPSI</Text>
                                <Text style={[styles.summaryValue, { fontWeight: '400', fontSize: 13 }]}>{form.deskripsi}</Text>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>KEPALA DINAS</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="person" size={16} color="#3B82F6" />
                                    <Text style={styles.summaryValue}>{form.namaKadis}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>ALAMAT LENGKAP</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="location" size={16} color="#E11D48" />
                                    <Text style={[styles.summaryValue, { fontWeight: '500' }]}>{form.alamat}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>WEBSITE</Text>
                                <View style={styles.summaryRowInner}>
                                    <Icon name="globe" size={16} color="#FFB800" />
                                    <Text style={styles.summaryValue}>{form.website || '-'}</Text>
                                </View>
                            </View>

                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>JUMLAH PEGAWAI</Text>
                                <Text style={styles.summaryValue}>{form.jumlahPegawai || '-'}</Text>
                            </View>

                             <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>MEDIA SOSIAL</Text>
                                <Text style={styles.summaryValue}>{form.mediaSosial || '-'}</Text>
                            </View>

                            {form.latitude && form.longitude && (
                                <View style={styles.summaryItem}>
                                    <Text style={styles.summaryLabel}>KOORDINAT (LAT/LNG)</Text>
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{form.latitude}, {form.longitude}</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={confirmSubmit}
                        >
                            <Text style={styles.confirmBtnText}>YA, SIMPAN DATA SEKARANG</Text>
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
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    col: {
        flex: 1,
    },
    footer: {
        marginTop: 24,
    },
    publishBtn: {
        backgroundColor: '#FFB800',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0,
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
        borderWidth: 2,
        borderColor: '#0F172A',
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
    summaryItem: {
        marginBottom: 16,
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
    summaryRowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
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
});
